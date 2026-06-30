import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        title: string;
        description: string;
        thumbnail?: string;
        isPremium?: boolean;
    }) {
        return this.prisma.course.create({
            data,
        });
    }



    async hasAccess(
        userId: string,
        courseId: string,
    ) {
        const access =
            await this.prisma.userCourseAccess.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

        return !!access;
    }

    async findOne(id: string, userId?: string) {
        const course =
            await this.prisma.course.findUnique({
                where: { id },
                include: {
                    sections: {
                        orderBy: {
                            order: 'asc',
                        },
                        include: {
                            lessons: {
                                orderBy: {
                                    order: 'asc',
                                },
                                include: {
                                    quiz: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!course) {
            throw new NotFoundException(
                'Course not found',
            );
        }

        const sections = await Promise.all(
            course.sections.map(async (section) => {

                const lessons = await Promise.all(
                    section.lessons.map(
                        async (lesson, index) => {

                            let completed = false;

                            if (userId) {
                                const progress =
                                    await this.prisma.userProgress.findUnique({
                                        where: {
                                            userId_lessonId: {
                                                userId,
                                                lessonId: lesson.id,
                                            },
                                        },
                                    });

                                completed =
                                    progress?.completed ?? false;
                            }

                            let locked = false;

                            if (index > 0 && userId) {

                                const prevLesson =
                                    section.lessons[index - 1];

                                const prevProgress =
                                    await this.prisma.userProgress.findUnique({
                                        where: {
                                            userId_lessonId: {
                                                userId,
                                                lessonId: prevLesson.id,
                                            },
                                        },
                                    });

                                locked =
                                    !prevProgress?.completed;
                            }

                            let quiz: any = null;

                            if (lesson.quiz) {

                                const questionCount =
                                    await this.prisma.question.count({
                                        where: {
                                            quizId: lesson.quiz.id,
                                        },
                                    });

                                let quizCompleted = false;

                                if (userId) {

                                    const result =
                                        await this.prisma.quizResult.findUnique({
                                            where: {
                                                userId_quizId: {
                                                    userId,
                                                    quizId: lesson.quiz.id,
                                                },
                                            },
                                        });

                                    quizCompleted =
                                        result?.passed ?? false;
                                }

                                quiz = {
                                    id: lesson.quiz.id,
                                    title: lesson.quiz.title,
                                    completed: quizCompleted,
                                    locked,
                                    questionCount,
                                };
                            }

                            return {
                                id: lesson.id,
                                title: lesson.title,
                                description: lesson.description,
                                type: lesson.type,
                                content: lesson.content,
                                videoUrl: lesson.videoUrl,
                                imageUrl: lesson.imageUrl,
                                xpReward: lesson.xpReward,
                                order: lesson.order,

                                completed,
                                locked,

                                quiz,
                            };
                        },
                    ),
                );

                return {
                    id: section.id,
                    title: section.title,
                    order: section.order,
                    lessons,
                };
            }),
        );

        return {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            isPremium: course.isPremium,
            xpReward: course.xpReward,
            category: course.category,
            level: course.level,

            sections,
        };

    }

    async getCourseProgress(userId: string, courseId: string) {
        const totalLessons = await this.prisma.lesson.count({
            where: {
                section: { courseId },
            },
        });

        const completedLessons = await this.prisma.userProgress.count({
            where: {
                userId,
                courseId,
                completed: true,
            },
        });

        const percent =
            totalLessons === 0
                ? 0
                : Math.round((completedLessons / totalLessons) * 100);

        // 🔥 CHECK: reward allaqachon berilganmi?
        const alreadyRewarded =
            await this.prisma.userCourseCompletion.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

        // 🔥 FAqat 100% + reward yo‘q bo‘lsa
        if (percent === 100 && !alreadyRewarded) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    xp: {
                        increment: 100,
                    },
                },
            });

            await this.prisma.userCourseCompletion.create({
                data: {
                    userId,
                    courseId,
                    rewarded: true,
                },
            });
        }

        return {
            totalLessons,
            completedLessons,
            percent,
        };
    }

    async findAll(query: any) {
        const { search, category, level, isPremium } = query;

        return this.prisma.course.findMany({
            where: {
                AND: [
                    search
                        ? {
                            title: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        }
                        : {},
                    category ? { category } : {},
                    level ? { level } : {},
                    isPremium !== undefined
                        ? { isPremium: isPremium === 'true' }
                        : {},
                ],
            },
            include: {
                sections: {
                    include: { lessons: true },
                },
            },
        });
    }


    async enrollCourse(
        userId: string,
        courseId: string,
    ) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new ForbiddenException(
                'User not found',
            );
        }

        if (!course) {
            throw new NotFoundException('Course not found');
        }


        if (
            course.isPremium &&
            !user.isPremium
        ) {
            throw new ForbiddenException(
                'Premium required',
            );
        }



        const existing =
            await this.prisma.userCourseAccess.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

        if (existing) {
            return {
                success: true,
                message: 'Already enrolled',
            };
        }

        await this.prisma.userCourseAccess.create({
            data: {
                userId,
                courseId,
                type: 'FREE',
            },
        });

        return {
            success: true,
            message: 'Course enrolled',
        };
    }


    async enrollByCode(
        userId: string,
        code: string,
    ) {
        const premiumCode =
            await this.prisma.premiumCode.findUnique({
                where: {
                    code,
                },
            });

        if (!premiumCode) {
            throw new NotFoundException(
                'Invalid code',
            );
        }

        if (premiumCode.isUsed) {
            throw new ForbiddenException(
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
            where: {
                id: premiumCode.id,
            },
            data: {
                isUsed: true,
            },
        });

        return {
            success: true,
            courseId: premiumCode.courseId,
        };
    }


}