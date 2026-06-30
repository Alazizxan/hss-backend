import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
    constructor(
        private lessonsService: LessonsService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('complete')
    completeLesson(
        @Req() req,
        @Body() body: any,
    ) {
        return this.lessonsService.completeLesson(
            req.user.userId,
            body.lessonId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('next')
    getNext(
        @Req() req,
        @Body() body: any,
    ) {
        return this.lessonsService.getNextLesson(
            req.user.userId,
            body.lessonId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('get')
    getLesson(
        @Req() req,
        @Body() body: any,
    ) {
        return this.lessonsService.getLesson(
            req.user.userId,
            body.lessonId,
        );
    }
}