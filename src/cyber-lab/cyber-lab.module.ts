import { Module } from '@nestjs/common';
import { CyberLabService } from './cyber-lab.service';
import { CyberLabController } from './cyber-lab.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommandService } from './engines/command/command.service';
import { FilesystemService } from './engines/filesystem/filesystem.service';
import { RuleService } from './engines/rule/rule.service';
import { PromptService } from './engines/prompt/prompt.service';

@Module({
  imports: [PrismaModule],
  controllers: [CyberLabController],
  providers: [CyberLabService, CommandService, FilesystemService, RuleService, PromptService],
})
export class CyberLabModule { }