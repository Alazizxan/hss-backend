import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RuleService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async process(
        session: any,
        command: string,
    ) {
        const rules =
            await this.prisma.cyberLabRule.findMany({
                where: {
                    labId: session.labId,
                },
            });

        const discovered =
            session.discoveredFlags || [];

        for (const rule of rules) {
            let matched = false;

            switch (rule.triggerType) {
                case 'COMMAND_EQUALS':
                    matched =
                        command ===
                        rule.triggerValue;
                    break;

                case 'COMMAND_CONTAINS':
                    matched =
                        command.includes(
                            rule.triggerValue,
                        );
                    break;

                case 'DIRECTORY_VISITED':
                    matched =
                        session.currentDirectory ===
                        rule.triggerValue;
                    break;

                case 'FILE_OPENED':
                    matched =
                        command.startsWith('cat ') ||
                        command.startsWith('head ') ||
                        command.startsWith('tail ') ||
                        command.startsWith('grep ');

                    if (matched) {
                        matched =
                            command.includes(
                                rule.triggerValue,
                            );
                    }
                    break;
            }

            if (
                matched &&
                !discovered.includes(
                    rule.rewardFlag,
                )
            ) {
                discovered.push(
                    rule.rewardFlag,
                );
            }
        }

        await this.prisma.cyberLabSession.update({
            where: {
                id: session.id,
            },
            data: {
                discoveredFlags:
                    discovered,
            },
        });

        return discovered;
    }
}