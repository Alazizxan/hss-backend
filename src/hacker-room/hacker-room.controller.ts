import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { HackerRoomService } from './hacker-room.service';

@Controller('hacker-room')
export class HackerRoomController {
    constructor(
        private service: HackerRoomService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('chat')
    chat(
        @Req() req,
        @Body() body: any,
    ) {
        return this.service.sendMessage(
            req.user.userId,
            body.message,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('history')
    history(
        @Req() req,
    ) {
        return this.service.getHistory(
            req.user.userId,
        );
    }
}