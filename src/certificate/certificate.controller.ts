import {
    Controller,
    Get,
    Param,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CertificateService } from './certificate.service';

@Controller('certificate')
export class CertificateController {

    constructor(
        private certificateService: CertificateService,
    ) { }

    @Get(':courseId')
    @UseGuards(JwtAuthGuard)
    async download(
        @Req() req,
        @Param('courseId') courseId: string,
        @Res() res,
    ) {
        const imageBuffer = await this.certificateService.generate(
            req.user.userId,
            courseId,
        );

        // Headerlarni o'rnatamiz
        res.set({
            'Content-Type': 'image/jpeg',
            'Content-Disposition': 'inline; filename=certificate.jpg',
            'Content-Length': imageBuffer.length.toString(), // String formatida bo'lishi xavfsizroq
        });

        // res.send o'rniga res.end ishlatamiz. 
        // Bu Express'ga bufferni hech qanday o'zgarishsiz, toza rasm holida yuborishni buyuradi.
        res.end(imageBuffer);
    }

    @Get('verify/:token')
    verify(
        @Param('token') token: string,
    ) {
        return this.certificateService.verify(
            token,
        );
    }

}