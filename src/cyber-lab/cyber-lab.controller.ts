import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';

import { CyberLabService } from './cyber-lab.service';
import { CreateCyberLabDto } from './dto/create-cyber-lab.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/role.decoretor';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { SubmitLabDto } from './dto/submit-lab.dto';
import { UpdateCyberLabDto } from './dto/update-cyber-lab.dto/update-cyber-lab.dto';
@Controller('cyber-labs')
export class CyberLabController {
    constructor(
        private readonly cyberLabService: CyberLabService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('start/:labId')
    start(
        @Req() req,
        @Param('labId') labId: string,
    ) {
        return this.cyberLabService.startLab(
            req.user.userId,
            labId,
        );
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Post()
    create(
        @Body()
        dto: CreateCyberLabDto,
    ) {
        return this.cyberLabService.createLab(
            dto,
        );
    }



    @Post('execute')
    @UseGuards(JwtAuthGuard)
    execute(
        @Req() req,
        @Body() dto: ExecuteCommandDto,
    ) {
        return this.cyberLabService.execute(
            req.user.userId,
            dto,
        );
    }


    @Post('seed/:labId')
    seed(
        @Param('labId') labId: string,
    ) {
        return this.cyberLabService.seedFileSystem(
            labId,
        );
    }


    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Post('rules')
    createRule(
        @Body()
        dto: CreateRuleDto,
    ) {
        return this.cyberLabService.createRule(
            dto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('submit')
    submit(
        @Req() req,
        @Body() dto: SubmitLabDto,
    ) {
        return this.cyberLabService.submitLab(
            req.user.userId,
            dto,
        );
    }


    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Req() req,
    ) {
        return this.cyberLabService.findAll(
            req.user.userId,
        );
    }


    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(
        @Param('id') id: string,
    ) {
        return this.cyberLabService.findOne(
            id,
        );
    }


    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCyberLabDto,
    ) {
        return this.cyberLabService.update(
            id,
            dto,
        );
    }



    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Delete(':id')
    remove(
        @Param('id') id: string,
    ) {
        return this.cyberLabService.remove(
            id,
        );
    }



}