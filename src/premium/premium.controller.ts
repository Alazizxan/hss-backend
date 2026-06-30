import {
    Body,
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';

import { PremiumService } from './premium.service';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/role.decoretor';

@Controller('premium')
export class PremiumController {
    constructor(
        private service: PremiumService,
    ) { }

    @Post('activate')
    activate(
        @Body() body: any,
    ) {
        return this.service.activateCode(
            body.userId,
            body.code,
        );
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Post('generate')
    generate(
        @Body() body: any,
    ) {
        return this.service.generateCode(
            body.courseId,
        );
    }
}