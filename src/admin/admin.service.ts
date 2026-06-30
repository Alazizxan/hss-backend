import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // ---------------- COURSES ----------------
    createCourse(dto: any) {
        return this.prisma.course.create({ data: dto });
    }

    updateCourse(id: string, dto: any) {
        return this.prisma.course.update({
            where: { id },
            data: dto,
        });
    }

    deleteCourse(id: string) {
        return this.prisma.course.delete({ where: { id } });
    }

    // ---------------- SECTIONS ----------------
    async createSection(dto: any) {
        const course = await this.prisma.course.findUnique({
            where: { id: dto.courseId },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        return this.prisma.section.create({
            data: dto,
        });
    }

    // ---------------- LESSONS ----------------
    createLesson(dto: any) {
        return this.prisma.lesson.create({ data: dto });
    }

    // ---------------- QUIZ ----------------
    createQuiz(dto: any) {
        return this.prisma.quiz.create({ data: dto });
    }

    createQuestion(dto: any) {
        return this.prisma.question.create({ data: dto });
    }

    createOption(dto: any) {
        return this.prisma.option.create({ data: dto });
    }

    // ---------------- PREMIUM ----------------
    generatePremiumCode(courseId: string) {
        const code = Math.random().toString(36).substring(2, 10);

        return this.prisma.premiumCode.create({
            data: {
                code,
                courseId,
            },
        });
    }

    // ---------------- USERS ----------------
    getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    grantPremium(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isPremium: true,
                premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
    }

    addXp(userId: string, xp: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: xp } },
        });
    }
}