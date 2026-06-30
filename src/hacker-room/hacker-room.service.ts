import {
    Injectable,
    ForbiddenException,
} from '@nestjs/common';

import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HackerRoomService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async sendMessage(
        userId: string,
        message: string,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!user) {
            throw new ForbiddenException(
                'User not found',
            );
        }

        if (!user.isPremium) {
            throw new ForbiddenException(
                'Premium required',
            );
        }

        await this.prisma.hackerRoomChat.create({
            data: {
                userId,
                role: 'user',
                message,
            },
        });

        const history =
            await this.prisma.hackerRoomChat.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    createdAt: 'asc',
                },
                take: 20,
            });

        const messages = [
            {
                role: 'system',
                content: `
You are Cyber Academy Hacker Room AI.

Rules:
- Teach cybersecurity.
- Explain concepts.
- Help with labs.
- Help with CTF challenges.
- Help with Linux.
- Help with Networking.
- Help with Web Security.
- Help with SOC.
- Help with Blue Team.
- Help with Ethical Hacking.

Never provide instructions for:
- malware creation
- ransomware creation
- credential theft
- real world attacks
- illegal hacking

Always explain safely.
                `,
            },

            ...history.map((item) => ({
                role: item.role,
                content: item.message,
            })),
        ];

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'qwen/qwen3-32b',
                messages,
                temperature: 0.7,
                max_tokens: 1500,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const aiMessage =
            response.data.choices[0].message.content;

        await this.prisma.hackerRoomChat.create({
            data: {
                userId,
                role: 'assistant',
                message: aiMessage,
            },
        });

        return {
            success: true,
            reply: aiMessage,
        };
    }

    async getHistory(userId: string) {
        return this.prisma.hackerRoomChat.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async clearHistory(userId: string) {
        await this.prisma.hackerRoomChat.deleteMany({
            where: {
                userId,
            },
        });

        return {
            success: true,
        };
    }
}