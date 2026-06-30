import { Module } from '@nestjs/common';

import { HackerRoomController } from './hacker-room.controller';
import { HackerRoomService } from './hacker-room.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [
    HackerRoomController,
  ],
  providers: [
    HackerRoomService,
    PrismaService,
  ],
})
export class HackerRoomModule { }