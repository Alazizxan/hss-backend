import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SectionsService } from './sections.service';

@Controller('sections')
export class SectionsController {
    constructor(private service: SectionsService) { }

    @Post()
    create(@Body() body: any) {
        return this.service.create(body);
    }

    @Get('course/:courseId')
    findByCourse(@Param('courseId') courseId: string) {
        return this.service.findByCourse(courseId);
    }
}