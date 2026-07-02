import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCyberLabDto } from './dto/create-cyber-lab.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { FilesystemEngine } from './filesystem.engine';
import { FilesystemService } from './engines/filesystem/filesystem.service';
import { RuleService } from './engines/rule/rule.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { SubmitLabDto } from './dto/submit-lab.dto';
import axios from 'axios';
import { UpdateCyberLabDto } from './dto/update-cyber-lab.dto/update-cyber-lab.dto';

@Injectable()
export class CyberLabService {
    constructor(
        private prisma: PrismaService,
        private filesystem: FilesystemService,
        private rule: RuleService,
    ) { }

    async startLab(
        userId: string,
        labId: string,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!user) {
            throw new NotFoundException(
                'User not found',
            );
        }

        if (!user.isPremium) {
            throw new ForbiddenException(
                'Premium required',
            );
        }

        const lab =
            await this.prisma.cyberLab.findUnique({
                where: {
                    id: labId,
                },
            });

        if (!lab) {
            throw new NotFoundException(
                'Lab not found',
            );
        }


        const oldSessions =
            await this.prisma.cyberLabSession.findMany({
                where: {
                    userId,
                    labId,
                },
                select: {
                    id: true,
                },
            });

        for (const old of oldSessions) {
            await this.prisma.cyberLabSessionFile.deleteMany({
                where: {
                    sessionId: old.id,
                },
            });
        }

        await this.prisma.cyberLabSession.deleteMany({
            where: {
                userId,
                labId,
            },
        });

        const session =
            await this.prisma.cyberLabSession.create({
                data: {
                    userId,
                    labId,

                    hostname: lab.hostname,
                    username: lab.username,

                    currentDirectory:
                        '/home/analyst',

                    commandHistory: [],
                    discoveredFlags: [],
                    environmentState: {},
                },
            });

        const templateFiles =
            await this.prisma.cyberLabFile.findMany({
                where: {
                    labId,
                },
            });

        await this.prisma.cyberLabSessionFile.createMany({
            data: templateFiles.map((f) => ({
                sessionId: session.id,

                path: f.path,
                name: f.name,
                type: f.type,

                content: f.content,

                permissions: f.permissions,
                owner: f.owner,
                group: f.group,

                hidden: f.hidden,
            })),
        });

        return {
            sessionId: session.id,

            briefing: lab.briefing,

            prompt:
                `${lab.username}@${lab.hostname}:~$`,

            objectives:
                lab.objectives,
        };
    }

    async createLab(dto: CreateCyberLabDto) {
        return this.prisma.cyberLab.create({
            data: {
                ...dto,
                xpReward: dto.xpReward ?? 100,
                estimatedTime:
                    dto.estimatedTime ?? 30,
            },
        });
    }

    async seedFileSystem(labId: string) {
        return this.prisma.cyberLabFile.createMany({
            data: [
                {
                    labId,
                    path: '/',
                    name: 'home',
                    type: 'DIRECTORY',
                },
                {
                    labId,
                    path: '/',
                    name: 'var',
                    type: 'DIRECTORY',
                },
                {
                    labId,
                    path: '/',
                    name: 'etc',
                    type: 'DIRECTORY',
                },

                {
                    labId,
                    path: '/home',
                    name: 'analyst',
                    type: 'DIRECTORY',
                },

                {
                    labId,
                    path: '/home/analyst',
                    name: 'Desktop',
                    type: 'DIRECTORY',
                },
                {
                    labId,
                    path: '/home/analyst',
                    name: 'Documents',
                    type: 'DIRECTORY',
                },
                {
                    labId,
                    path: '/home/analyst',
                    name: 'Downloads',
                    type: 'DIRECTORY',
                },

                {
                    labId,
                    path: '/var',
                    name: 'log',
                    type: 'DIRECTORY',
                },

                {
                    labId,
                    path: '/var/log',
                    name: 'auth.log',
                    type: 'FILE',
                    content: `
Jul 01 02:14:11 Failed password for root from 192.168.1.50
Jul 01 02:14:16 Failed password for root from 192.168.1.50
Jul 01 02:14:21 Failed password for admin from 192.168.1.50
                `,
                },
            ],
        });
    }


    async execute(
        userId: string,
        dto: ExecuteCommandDto,
    ) {
        const session =
            await this.prisma.cyberLabSession.findFirst({
                where: {
                    id: dto.sessionId,
                    userId,
                },
            });

        if (!session) {
            throw new NotFoundException(
                'Session not found',
            );
        }

        const command =
            dto.command.trim();

        const history = [
            ...(session.commandHistory as string[]),
            command,
        ];

        let output = '';

        switch (true) {
            case command === 'pwd':
                output =
                    await this.filesystem.pwd(
                        session,
                    );
                break;

            case command === 'whoami':
                output =
                    await this.filesystem.whoami(
                        session,
                    );
                break;

            case command === 'hostname':
                output =
                    await this.filesystem.hostname(
                        session,
                    );
                break;

            case command === 'history':
                output = history.join('\n');
                break;

            case command === 'ls':
                output =
                    await this.filesystem.ls(
                        session,
                    );
                break;


            case command.startsWith('cd'):
                const target =
                    command.replace('cd', '').trim();

                const result =
                    await this.filesystem.cd(
                        session,
                        target,
                    );

                if (!result.success) {
                    output = result.output;
                    break;
                }

                await this.prisma.cyberLabSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        currentDirectory:
                            result.nextPath,
                    },
                });

                session.currentDirectory =
                    result.nextPath;

                output = '';
                break;

            case command.startsWith('cat '):
                const fileName =
                    command.replace('cat ', '').trim();

                const catResult =
                    await this.filesystem.cat(
                        session,
                        fileName,
                    );

                output = catResult.output;

                break;


            case command.startsWith('grep '):
                const grepParts =
                    command.split(' ');

                if (grepParts.length < 3) {
                    output =
                        'grep: usage: grep PATTERN FILE';
                    break;
                }

                const grepResult =
                    await this.filesystem.grep(
                        session,
                        grepParts[1],
                        grepParts[2],
                    );

                output = grepResult.output;

                break;
            case command.startsWith('head '):
                const headFileName =
                    command.replace('head ', '').trim();

                const headResult =
                    await this.filesystem.head(
                        session,
                        headFileName,
                    );

                output = headResult.output;

                break;


            case command.startsWith('tail '):
                const tailFileName =
                    command.replace('tail ', '').trim();

                const tailResult =
                    await this.filesystem.tail(
                        session,
                        tailFileName,
                    );

                output = tailResult.output;

                break;
            case command.startsWith('find '):
                const tokens =
                    command.split(' ');

                const searchName =
                    tokens[tokens.length - 1];

                output =
                    await this.filesystem.find(
                        session,
                        searchName,
                    );

                break;


            case command === 'ls -la':
                output =
                    await this.filesystem.lsLong(
                        session,
                    );
                break;

            case command === 'uname -a':
                output =
                    'Linux web-03 6.8.0-90-generic HSS-OS 24.04 x86_64';
                break;

            case command === 'date':
                output =
                    new Date().toUTCString();
                break;


            case command === 'uptime':
                output =
                    '14:32:15 up 12 days, 4 users, load average: 0.15, 0.18, 0.20';
                break;


            case command.startsWith('mkdir '):
                output =
                    await this.filesystem.mkdir(
                        session,
                        command.replace(
                            'mkdir ',
                            '',
                        ).trim(),
                    );
                break;

            case command.startsWith('touch '):
                output =
                    await this.filesystem.touch(
                        session,
                        command.replace(
                            'touch ',
                            '',
                        ).trim(),
                    );
                break;

            case command.startsWith('rm '):
                output =
                    await this.filesystem.rm(
                        session,
                        command.replace(
                            'rm ',
                            '',
                        ).trim(),
                    );
                break;


            case command === 'id':
                output =
                    this.filesystem.id(
                        session,
                    );
                break;

            case command === 'uname -a':
                output =
                    this.filesystem.uname();
                break;

            case command === 'ip addr':
                output =
                    this.filesystem.ipAddr();
                break;

            case command === 'ip route':
                output =
                    this.filesystem.ipRoute();
                break;

            case command === 'ps aux':
                output =
                    this.filesystem.psAux();
                break;

            case command === 'clear':
                return {
                    clear: true,
                    prompt: this.filesystem.buildPrompt(
                        session,
                    ),
                };

            default:
                output =
                    `bash: ${command}: command not found`;
        }



        await this.prisma.cyberLabSession.update({
            where: {
                id: session.id,
            },
            data: {
                commandHistory: history,
            },
        });

        const freshSession =
            await this.prisma.cyberLabSession.findUnique({
                where: {
                    id: session.id,
                },
            });

        await this.rule.process(
            freshSession,
            command,
        );

        const updatedSession =
            await this.prisma.cyberLabSession.findUnique({
                where: {
                    id: session.id,
                },
            });

        const discoveredFlags =
            (updatedSession?.discoveredFlags as string[]) || [];

        const totalObjectives =
            await this.prisma.cyberLabRule.count({
                where: {
                    labId: session.labId,
                },
            });

        return {
            output,

            prompt:
                this.filesystem.buildPrompt(
                    updatedSession ?? session,
                ),

            discoveredFlags,

            progress:
                discoveredFlags.length,

            totalObjectives,
        };
    }


    async createRule(
        dto: CreateRuleDto,
    ) {
        return this.prisma.cyberLabRule.create({
            data: {
                ...dto,
                xpReward: dto.xpReward ?? 0,
            },
        });
    }


    async submitLab(
        userId: string,
        dto: SubmitLabDto,
    ) {
        const session =
            await this.prisma.cyberLabSession.findFirst({
                where: {
                    id: dto.sessionId,
                    userId,
                },
                include: {
                    lab: true,
                },
            });

        if (!session) {
            throw new NotFoundException(
                'Session not found',
            );
        }

        const discovered =
            (session.discoveredFlags as string[]) || [];

        const rules =
            await this.prisma.cyberLabRule.findMany({
                where: {
                    labId: session.labId,
                },
            });

        const aiResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'qwen/qwen3-32b',
                messages: [
                    {
                        role: 'system',
                        content: `
You are an expert cybersecurity instructor and SOC mentor.

Evaluate a student's investigation.

The student speaks Uzbek.

ALL feedback, strengths and weaknesses MUST be written in professional Uzbek language using Cyrillic or Latin Uzbek.

Return ONLY valid JSON.

You will receive:
- Lab story
- Objectives
- Commands executed
- Flags discovered
- Final report
- Answers

Format:

{
  "score": 0-100,
  "grade": "A|B|C|D|F",
  "feedback": [
    "..."
  ],
  "strengths": [
    "..."
  ],
  "weaknesses": [
    "..."
  ]
}

Rules:

- feedback MUST be in Uzbek
- strengths MUST be in Uzbek
- weaknesses MUST be in Uzbek
- Keep responses short and practical.
- Mention investigation quality.
- Mention command usage quality.
- Mention missing evidence if applicable.

Scoring rules:

90-100 = Excellent investigation
80-89 = Good investigation
70-79 = Acceptable
60-69 = Needs improvement
0-59 = Failed

Do not output markdown.
Do not output explanations.
Only output JSON.
`,
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            lab: {
                                title:
                                    session.lab.title,
                                description:
                                    session.lab.description,
                                briefing:
                                    session.lab.briefing,
                                objectives:
                                    session.lab.objectives,
                            },

                            commands:
                                session.commandHistory,

                            discoveredFlags:
                                discovered,

                            availableFlags:
                                rules.map(
                                    (
                                        r,
                                    ) =>
                                        r.rewardFlag,
                                ),

                            report:
                                dto.report,

                            answers:
                                dto.answers,
                        }),
                    },
                ],
                temperature: 0.2,
                max_tokens: 800,
                response_format: {
                    type: 'json_object',
                },
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type':
                        'application/json',
                },
            },
        );

        const evaluation =
            JSON.parse(
                aiResponse.data.choices[0]
                    .message.content,
            );

        const xpEarned =
            Math.round(
                session.lab.xpReward *
                (evaluation.score / 100),
            );

        const completion =
            await this.prisma.cyberLabCompletion.findUnique({
                where: {
                    userId_labId: {
                        userId,
                        labId: session.labId,
                    },
                },
            });

        if (!completion) {
            await this.prisma.cyberLabCompletion.create({
                data: {
                    userId,
                    labId: session.labId,
                    bestScore: evaluation.score,
                    attempts: 1,
                    xpRewarded:
                        evaluation.score >= 60,
                },
            });

            if (evaluation.score >= 60) {
                await this.prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        xp: {
                            increment:
                                xpEarned,
                        },
                    },
                });
            }
        } else {
            await this.prisma.cyberLabCompletion.update({
                where: {
                    userId_labId: {
                        userId,
                        labId: session.labId,
                    },
                },
                data: {
                    attempts: {
                        increment: 1,
                    },

                    bestScore: Math.max(
                        completion.bestScore,
                        evaluation.score,
                    ),
                },
            });
        }


        await this.prisma.cyberLabSessionFile.deleteMany({
            where: {
                sessionId: session.id,
            },
        });

        await this.prisma.cyberLabSession.delete({
            where: {
                id: session.id,
            },
        });

        return {
            success: true,

            score:
                evaluation.score,

            grade:
                evaluation.grade,

            xpEarned,

            feedback:
                evaluation.feedback,

            strengths:
                evaluation.strengths,

            weaknesses:
                evaluation.weaknesses,

            discoveredFlags:
                discovered,
        };
    }


    async findAll(
        userId: string,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        const labs =
            await this.prisma.cyberLab.findMany({
                where: {
                    isPublished: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

        const completions =
            await this.prisma.cyberLabCompletion.findMany({
                where: {
                    userId,
                },
            });

        const completionMap = new Map(
            completions.map((c) => [
                c.labId,
                c,
            ]),
        );

        return labs.map((lab) => {
            const completion =
                completionMap.get(lab.id);

            return {
                id: lab.id,
                code: lab.code,

                title: lab.title,
                description: lab.description,

                category: lab.category,
                difficulty: lab.difficulty,

                xpReward: lab.xpReward,
                estimatedTime:
                    lab.estimatedTime,

                isPremium: true,

                available:
                    user?.isPremium ?? false,

                completed:
                    !!completion,

                bestScore:
                    completion?.bestScore ?? null,

                attempts:
                    completion?.attempts ?? 0,

                xpRewarded:
                    completion?.xpRewarded ?? false,

                completedAt:
                    completion?.completedAt ?? null,
            };
        });
    }


    async findOne(id: string) {
        const lab =
            await this.prisma.cyberLab.findUnique({
                where: {
                    id,
                },
            });

        if (!lab) {
            throw new NotFoundException(
                'Lab not found',
            );
        }

        return lab;
    }


    async update(
        id: string,
        dto: UpdateCyberLabDto,
    ) {
        const lab =
            await this.prisma.cyberLab.findUnique({
                where: {
                    id,
                },
            });

        if (!lab) {
            throw new NotFoundException(
                'Lab not found',
            );
        }

        return this.prisma.cyberLab.update({
            where: {
                id,
            },
            data: dto,
        });
    }



    async remove(
        id: string,
    ) {
        const lab =
            await this.prisma.cyberLab.findUnique({
                where: {
                    id,
                },
            });

        if (!lab) {
            throw new NotFoundException(
                'Lab not found',
            );
        }

        await this.prisma.cyberLabRule.deleteMany({
            where: {
                labId: id,
            },
        });

        await this.prisma.cyberLabFile.deleteMany({
            where: {
                labId: id,
            },
        });

        await this.prisma.cyberLabCompletion.deleteMany({
            where: {
                labId: id,
            },
        });

        await this.prisma.cyberLabSessionFile.deleteMany({
            where: {
                session: {
                    labId: id,
                },
            },
        });

        await this.prisma.cyberLabSession.deleteMany({
            where: {
                labId: id,
            },
        });

        await this.prisma.cyberLab.delete({
            where: {
                id,
            },
        });

        return {
            success: true,
        };
    }





}