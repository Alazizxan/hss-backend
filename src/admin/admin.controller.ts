import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decoretor';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { GrantPremiumDto } from './dto/grant-premium.dto';
import { GeneratePremiumCodeDto } from './dto/generate-code.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private admin: AdminService) { }

    @Post('course')
    createCourse(@Body() body: CreateCourseDto) {
        return this.admin.createCourse(body);
    }

    @Post('section')
    createSection(@Body() body: CreateSectionDto) {
        return this.admin.createSection(body);
    }

    @Post('lesson')
    createLesson(@Body() body: CreateLessonDto) {
        return this.admin.createLesson(body);
    }

    @Post('quiz')
    createQuiz(@Body() body: CreateQuizDto) {
        return this.admin.createQuiz(body);
    }


    @Post('question')
    createQuestion(@Body() body: CreateQuestionDto) {
        return this.admin.createQuestion(body);
    }

    @Post('option')
    createOption(@Body() body: CreateOptionDto) {
        return this.admin.createOption(body);
    }

    @Get('users')
    getUsers() {
        return this.admin.getUsers();
    }

    @Post('users/premium')
    grantPremium(@Body() body: GrantPremiumDto) {
        return this.admin.grantPremium(body.userId);
    }


    @Post('premium/code')
    generateCode(@Body() body: GeneratePremiumCodeDto) {
        return this.admin.generatePremiumCode(body.courseId);
    }

    @Post('users/xp')
    addXp(@Body() body: any) {
        return this.admin.addXp(body.userId, body.xp);
    }
}