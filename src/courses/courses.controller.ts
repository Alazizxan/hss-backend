import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/role.decoretor';

@Controller('courses')
export class CoursesController {
    constructor(private service: CoursesService) { }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Post()
    create(@Body() body: any) {
        return this.service.create(body);
    }
    @Get()
    findAll(@Query() query: any) {
        return this.service.findAll(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(
        @Req() req,
        @Param('id') id: string,
    ) {
        return this.service.findOne(
            id,
            req.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('progress')
    getProgress(
        @Req() req,
        @Body() body: any,
    ) {
        return this.service.getCourseProgress(
            req.user.userId,
            body.courseId,
        );
    }


    @UseGuards(JwtAuthGuard)
    @Post('enroll')
    enrollCourse(
        @Req() req,
        @Body() body: any,
    ) {
        return this.service.enrollCourse(
            req.user.userId,
            body.courseId,
        );
    }


    @UseGuards(JwtAuthGuard)
    @Post('redeem')
    redeemCode(
        @Req() req,
        @Body() body: any,
    ) {
        return this.service.enrollByCode(
            req.user.userId,
            body.code,
        );
    }






}