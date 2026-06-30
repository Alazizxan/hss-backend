import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
    constructor(
        private quizService: QuizService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('get')
    getQuiz(
        @Req() req,
        @Body() body: any,
    ) {
        return this.quizService.getQuiz(
            req.user.userId,
            body.lessonId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('submit')
    submit(
        @Req() req,
        @Body() body: any,
    ) {
        return this.quizService.submitQuiz(
            req.user.userId,
            body.quizId,
            body.answers,
        );
    }
}