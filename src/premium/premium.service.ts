import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PremiumService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async activateCode(
        userId: string,
        code: string,
    ) {
        const premiumCode =
            await this.prisma.premiumCode.findUnique({
                where: { code },
            });

        if (!premiumCode) {
            throw new BadRequestException(
                'Invalid code',
            );
        }

        if (premiumCode.isUsed) {
            throw new BadRequestException(
                'Code already used',
            );
        }

        await this.prisma.userCourseAccess.create({
            data: {
                userId,
                courseId: premiumCode.courseId,
                type: 'CODE',
            },
        });

        await this.prisma.premiumCode.update({
            where: { code },
            data: {
                isUsed: true,
            },
        });

        return {
            message:
                'Course unlocked successfully',
        };
    }

    async generateCode(
        courseId: string,
    ) {
        const code = randomUUID()
            .replace(/-/g, '')
            .slice(0, 12)
            .toUpperCase();

        return this.prisma.premiumCode.create({
            data: {
                code,
                courseId,
            },
        });
    }
}