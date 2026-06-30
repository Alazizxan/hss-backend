import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        title: string;
        order: number;
        courseId: string;
    }) {
        return this.prisma.section.create({
            data,
        });
    }

    findByCourse(courseId: string) {
        return this.prisma.section.findMany({
            where: { courseId },
            include: {
                lessons: true,
            },
            orderBy: {
                order: 'asc',
            },
        });
    }
}