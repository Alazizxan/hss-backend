import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import * as fs from 'fs';
import * as path from 'path';

import * as QRCode from 'qrcode';

import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import sharp from 'sharp';


@Injectable()
export class CertificateService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async generate(
        userId: string,
        courseId: string,
    ): Promise<Buffer> {

        //------------------------------------
        // USER
        //------------------------------------

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

        //------------------------------------
        // COURSE
        //------------------------------------

        const course =
            await this.prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

        if (!course) {
            throw new NotFoundException(
                'Course not found',
            );
        }

        //------------------------------------
        // COURSE COMPLETED?
        //------------------------------------

        const completed =
            await this.prisma.userCourseCompletion.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

        if (!completed) {
            throw new ForbiddenException(
                'Course not completed',
            );
        }

        //------------------------------------
        // CERTIFICATE
        //------------------------------------

        let certificate =
            await this.prisma.certificate.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

        if (!certificate) {

            certificate =
                await this.prisma.certificate.create({
                    data: {
                        userId,
                        courseId,
                    },
                });

        }

        //------------------------------------
        // VERIFY URL
        //------------------------------------

        const verifyUrl =
            `${process.env.API_URL}/certificate/verify/${certificate.verifyToken}`;

        //------------------------------------
        // LOAD SVG TEMPLATE
        //------------------------------------

        const templatePath =
            path.join(
                process.cwd(),
                'src',
                'certificate',
                'template.svg',
            );

        let svg =
            fs.readFileSync(
                templatePath,
                'utf8',
            );

        //------------------------------------
        // QR CODE SVG
        //------------------------------------

        const qrSvg =
            await QRCode.toString(
                verifyUrl,
                {
                    type: 'svg',
                    margin: 0,
                    width: 180,
                },
            );

        //------------------------------------
        // DATE
        //------------------------------------

        const date =
            new Intl.DateTimeFormat(
                'en-GB',
                {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                },
            ).format(new Date());

        //------------------------------------
        // REPLACE PLACEHOLDERS
        //------------------------------------

        svg = svg.replace(/{{{NAME}}}/g, user.username);

        svg = svg.replace(/{{{COURSE}}}/g, course.title);

        svg = svg.replace(/{{{DATE}}}/g, date);

        svg = svg.replace(/{{{VERIFY_URL}}}/g, verifyUrl);



        //------------------------------------
        // QR SVG ichidagi XML headerni olib tashlaymiz
        //------------------------------------

        const cleanQr =
            qrSvg
                .replace(
                    /<\?xml.*?\?>/,
                    '',
                )
                .replace(
                    /<!DOCTYPE.*?>/,
                    '',
                );

        svg = svg.replace(/{{{QR_CODE}}}/g, cleanQr);

        //------------------------------------
        // JPG GENERATION (Sharp)
        //------------------------------------
        try {
            const svgBuffer = Buffer.from(svg);

            // SVG formatini to'g'ridan-to'g'ri yuqori sifatli JPG ga o'giramiz
            const jpgBuffer = await sharp(svgBuffer)
                .jpeg({
                    quality: 100,
                    chromaSubsampling: '4:4:4'
                })
                .toBuffer();

            return jpgBuffer;
        } catch (error) {
            console.error('Sharp error:', error);
            throw new ForbiddenException('Sertifikat rasmini yaratishda xatolik yuz berdi');
        }
    }
    async verify(token: string) {

        const certificate =
            await this.prisma.certificate.findUnique({
                where: {
                    verifyToken: token,
                },
            });

        if (!certificate) {
            throw new NotFoundException(
                'Certificate not found',
            );
        }

        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: certificate.userId,
                },
                select: {
                    username: true,
                    level: true,
                    xp: true,
                },
            });

        const course =
            await this.prisma.course.findUnique({
                where: {
                    id: certificate.courseId,
                },
                select: {
                    title: true,
                },
            });

        return {
            valid: true,

            certificateId: certificate.id,

            username: user?.username,

            level: user?.level,

            xp: user?.xp,

            course: course?.title,

            issuedAt: certificate.createdAt,
        };
    }
};