import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
    constructor(private prisma: PrismaService) { }

    async submitQuiz(
        userId: string,
        quizId: string,
        answers: Record<string, string>,
    ) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
                lesson: true,
            },
        });

        if (!quiz) {
            throw new BadRequestException('Quiz not found');
        }

        let correct = 0;
        const total = quiz.questions.length;

        for (const q of quiz.questions) {
            const selectedOptionId = answers[q.id];

            const option = q.options.find(
                (o) => o.id === selectedOptionId,
            );

            if (option?.isCorrect) {
                correct++;
            }
        }

        const score = Math.round((correct / total) * 100);
        const passed = score >= 70;

        // HAR BIR URINISH TARIXI
        await this.prisma.quizAttempt.create({
            data: {
                userId,
                quizId,
                score,
                passed,
            },
        });

        const oldResult =
            await this.prisma.quizResult.findUnique({
                where: {
                    userId_quizId: {
                        userId,
                        quizId,
                    },
                },
            });

        const firstPass =
            passed &&
            (!oldResult || oldResult.passed === false);

        const result =
            await this.prisma.quizResult.upsert({
                where: {
                    userId_quizId: {
                        userId,
                        quizId,
                    },
                },
                update: {
                    score,
                    passed,
                },
                create: {
                    userId,
                    quizId,
                    score,
                    passed,
                },
            });

        if (firstPass) {
            await this.prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    xp: {
                        increment: 50,
                    },
                },
            });
        }

        let nextLesson: any = null;

        if (passed && quiz.lesson) {
            nextLesson =
                await this.prisma.lesson.findFirst({
                    where: {
                        sectionId: quiz.lesson.sectionId,
                        order: {
                            gt: quiz.lesson.order,
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                });
        }

        return {
            score,
            passed,
            result,
            nextLesson,
        };
    }

    async getQuiz(
        userId: string,
        lessonId: string,
    ) {
        const quiz =
            await this.prisma.quiz.findFirst({
                where: {
                    lessonId,
                },
                include: {
                    questions: {
                        include: {
                            options: {
                                select: {
                                    id: true,
                                    text: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!quiz) {
            throw new BadRequestException(
                'Quiz not found',
            );
        }

        const result =
            await this.prisma.quizResult.findUnique({
                where: {
                    userId_quizId: {
                        userId,
                        quizId: quiz.id,
                    },
                },
            });

        // Quiz allaqachon topshirilgan
        if (result) {
            return {
                id: quiz.id,
                title: quiz.title,

                completed: true,
                score: result.score,
                passed: result.passed,

                questions: [],
            };
        }

        // Quiz hali topshirilmagan
        return {
            id: quiz.id,
            title: quiz.title,

            completed: false,

            questions: quiz.questions.map(
                (q) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options,
                }),
            ),
        };

    }
}