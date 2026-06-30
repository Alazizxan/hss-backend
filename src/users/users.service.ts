import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateLevel, getLevelProgress } from './level.util';
import { getRank } from './rank.util';


import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        const allUsers = await this.prisma.user.count({
            where: {
                xp: {
                    gt: user.xp,
                },
            },
        });

        return {
            ...user,
            rank: getRank(user.xp),
            position: allUsers + 1,
        };
    }

    async addXp(userId: string, xp: number) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: xp },
            },
        });

        const level = calculateLevel(user.xp);

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                level,
            },
        });
    }

    async findLeaderboard() {
        const users = await this.prisma.user.findMany({
            orderBy: { xp: 'desc' },
            take: 50,
            select: {
                id: true,
                username: true,
                xp: true,
                level: true,
            },
        });

        return users.map((u, index) => ({
            ...u,
            rank: getRank(u.xp),
            position: index + 1,
        }));
    }

    create(data: {
        username: string;
        email: string;
        passwordHash: string;
    }) {
        return this.prisma.user.create({
            data,
        });
    }

    async getUserRankPosition(userId: string) {
        const users = await this.prisma.user.findMany({
            orderBy: { xp: 'desc' },
            select: { id: true },
        });

        const index = users.findIndex(u => u.id === userId);

        return {
            position: index + 1,
        };
    }


    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return null;
        }

        const completedLessons =
            await this.prisma.userProgress.count({
                where: {
                    userId,
                    completed: true,
                },
            });

        const totalLessons =
            await this.prisma.userProgress.count({
                where: {
                    userId,
                },
            });

        const progressPercent =
            totalLessons === 0
                ? 0
                : Math.round(
                    (completedLessons / totalLessons) * 100,
                );

        const enrolledCourses =
            await this.prisma.userCourseAccess.count({
                where: {
                    userId,
                },
            });

        const completedCourses =
            await this.prisma.userCourseCompletion.count({
                where: {
                    userId,
                },
            });

        const quizAttempts =
            await this.prisma.quizAttempt.count({
                where: {
                    userId,
                },
            });

        const passedQuizzes =
            await this.prisma.quizResult.count({
                where: {
                    userId,
                    passed: true,
                },
            });

        const leaderboardPosition =
            await this.getUserRankPosition(userId);

        return {
            id: user.id,
            username: user.username,
            email: user.email,

            xp: user.xp,
            level: user.level,
            rank: getRank(user.xp),

            position: leaderboardPosition.position,

            isPremium: user.isPremium,
            premiumUntil: user.premiumUntil,

            joinedAt: user.createdAt,

            stats: {
                enrolledCourses,
                completedCourses,

                completedLessons,
                totalLessons,
                progressPercent,

                quizAttempts,
                passedQuizzes,
            },
        };
    }


    async updateProfile(
        userId: string,
        username: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return null;
        }

        // Username o'zgarmagan
        if (user.username === username) {
            return {
                success: true,
                message: 'Profile updated',
            };
        }

        // Username bandmi?
        const existing =
            await this.prisma.user.findUnique({
                where: {
                    username,
                },
            });

        if (existing) {
            throw new BadRequestException(
                'Username already exists',
            );
        }

        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                username,
            },
        });

        return {
            success: true,
            message: 'Profile updated',
        };
    }

    async getDashboard(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });



        if (!user) {
            return null;
        }


        const levelProgress =
            getLevelProgress(user.xp);

        const completedLessons =
            await this.prisma.userProgress.count({
                where: {
                    userId,
                    completed: true,
                },
            });

        const totalLessons =
            await this.prisma.userProgress.count({
                where: {
                    userId,
                },
            });

        const progressPercent =
            totalLessons === 0
                ? 0
                : Math.round(
                    (completedLessons / totalLessons) * 100,
                );

        const quizAttempts =
            await this.prisma.quizAttempt.count({
                where: {
                    userId,
                },
            });

        const passedQuizzes =
            await this.prisma.quizResult.count({
                where: {
                    userId,
                    passed: true,
                },
            });

        const enrolledCourses =
            await this.prisma.userCourseAccess.count({
                where: {
                    userId,
                },
            });

        const leaderboardPosition =
            await this.getUserRankPosition(userId);

        return {
            id: user.id,
            username: user.username,
            email: user.email,

            xp: user.xp,
            level: user.level,
            rank: getRank(user.xp),

            levelProgress,

            position: leaderboardPosition.position,

            isPremium: user.isPremium,

            stats: {
                enrolledCourses,
                completedLessons,
                totalLessons,
                progressPercent,

                quizAttempts,
                passedQuizzes,
            },
        };
    }


    async getMyCourses(userId: string) {
        const courses =
            await this.prisma.userCourseAccess.findMany({
                where: {
                    userId,
                },
                include: {
                    course: {
                        include: {
                            sections: {
                                include: {
                                    lessons: true,
                                },
                            },
                        },
                    },
                },
            });

        return courses.map(
            (item) => item.course,
        );
    }

    async changePassword(
        userId: string,
        oldPassword: string,
        newPassword: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new BadRequestException(
                'User not found',
            );
        }

        const valid = await bcrypt.compare(
            oldPassword,
            user.passwordHash,
        );

        if (!valid) {
            throw new BadRequestException(
                'Old password is incorrect',
            );
        }

        const samePassword = await bcrypt.compare(
            newPassword,
            user.passwordHash,
        );

        if (samePassword) {
            throw new BadRequestException(
                'New password must be different',
            );
        }

        const passwordHash =
            await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                passwordHash,
            },
        });

        return {
            success: true,
            message: 'Password updated',
        };
    }


    async deleteAccount(
        userId: string,
        password: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new BadRequestException(
                'User not found',
            );
        }

        const valid = await bcrypt.compare(
            password,
            user.passwordHash,
        );

        if (!valid) {
            throw new BadRequestException(
                'Password is incorrect',
            );
        }

        await this.prisma.$transaction(async (tx) => {

            await tx.userProgress.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.quizAttempt.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.quizResult.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.userCourseAccess.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.userCourseCompletion.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.hackerRoomChat.deleteMany({
                where: {
                    userId,
                },
            });

            await tx.user.delete({
                where: {
                    id: userId,
                },
            });

        });

        return {
            success: true,
            message: 'Account deleted',
        };
    }

    async checkUsername(username: string) {
        const exists = await this.prisma.user.findUnique({
            where: {
                username,
            },
        });

        return {
            available: !exists,
        };
    }


}