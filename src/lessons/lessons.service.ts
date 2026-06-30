import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        title: string;
        description?: string;
        type: string;
        content?: string;
        videoUrl?: string;
        imageUrl?: string;
        order: number;
        sectionId: string;
    }) {
        return this.prisma.lesson.create({
            data,
        });
    }

    findBySection(sectionId: string) {
        return this.prisma.lesson.findMany({
            where: { sectionId },
            orderBy: { order: 'asc' },
        });
    }



    async completeLesson(userId: string, lessonId: string) {
        // 1. Lesson topish
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return { error: 'Lesson not found' };
        }

        // 2. Section topish (courseId olish uchun)
        const section = await this.prisma.section.findUnique({
            where: { id: lesson.sectionId },
        });

        if (!section) {
            return { error: 'Section not found' };
        }

        const courseId = section.courseId;

        // 3. Progress saqlash
        const progress = await this.prisma.userProgress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
            update: {
                completed: true,
            },
            create: {
                userId,
                lessonId,
                courseId,
                completed: true,
                xpEarned: lesson.xpReward,
            },
        });

        // 4. XP berish
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                xp: {
                    increment: lesson.xpReward,
                },
            },
        });

        const nextLesson =
            await this.prisma.lesson.findFirst({
                where: {
                    sectionId: lesson.sectionId,
                    order: {
                        gt: lesson.order,
                    },
                },
                orderBy: {
                    order: 'asc',
                },
            });

        return {
            success: true,

            xp: lesson.xpReward,

            completed: true,

            hasNext: !!nextLesson,
            nextLessonId: nextLesson?.id ?? null,

            progress,
        };
    }

    async getNextLesson(userId: string, lessonId: string) {
        const currentLesson =
            await this.prisma.lesson.findUnique({
                where: { id: lessonId },
            });

        if (!currentLesson) {
            return { error: 'Lesson not found' };
        }

        const section =
            await this.prisma.section.findUnique({
                where: { id: currentLesson.sectionId },
            });

        // user progress check
        const progress =
            await this.prisma.userProgress.findUnique({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId,
                    },
                },
            });

        if (!progress?.completed) {
            return {
                message:
                    'Complete current lesson first',
            };
        }

        // next lesson
        const nextLesson =
            await this.prisma.lesson.findFirst({
                where: {
                    sectionId: currentLesson.sectionId,
                    order: {
                        gt: currentLesson.order,
                    },
                },
                orderBy: {
                    order: 'asc',
                },
            });

        return nextLesson || {
            message: 'Course finished',
        };
    }

    async getLesson(userId: string, lessonId: string) {
        const lesson =
            await this.prisma.lesson.findUnique({
                where: { id: lessonId },
            });

        if (!lesson) {
            return {
                error: 'Lesson not found',
            };
        }

        // LOCK CHECK
        if (lesson.order > 1) {
            const prevLesson =
                await this.prisma.lesson.findFirst({
                    where: {
                        sectionId: lesson.sectionId,
                        order: lesson.order - 1,
                    },
                });

            if (prevLesson) {
                const prevProgress =
                    await this.prisma.userProgress.findUnique({
                        where: {
                            userId_lessonId: {
                                userId,
                                lessonId: prevLesson.id,
                            },
                        },
                    });

                if (!prevProgress?.completed) {
                    return {
                        locked: true,
                        message:
                            'Lesson locked. Complete previous lesson first.',
                    };
                }
            }
        }

        const progress =
            await this.prisma.userProgress.findUnique({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId,
                    },
                },
            });

        const nextLesson =
            await this.prisma.lesson.findFirst({
                where: {
                    sectionId: lesson.sectionId,
                    order: {
                        gt: lesson.order,
                    },
                },
                orderBy: {
                    order: 'asc',
                },
            });

        return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            content: lesson.content,

            videoUrl: lesson.videoUrl,
            imageUrl: lesson.imageUrl,

            xpReward: lesson.xpReward,

            completed: !!progress?.completed,

            hasNext: !!nextLesson,
            nextLessonId: nextLesson?.id ?? null,
        };
    }
}