import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { CoursesModule } from './courses/courses.module';
import { SectionsModule } from './sections/sections.module';
import { LessonsModule } from './lessons/lessons.module';
import { PremiumModule } from './premium/premium.module';
import { QuizModule } from './quiz/quiz.module';
import { AdminModule } from './admin/admin.module';
import { HackerRoomModule } from './hacker-room/hacker-room.module';
import { CertificateModule } from './certificate/certificate.module';
import { CyberLabModule } from './cyber-lab/cyber-lab.module';
import { TelegramService } from './telegram/telegram.service';
import { TelegramModule } from './telegram/telegram.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StorageModule,
    CoursesModule,
    SectionsModule,
    LessonsModule,
    PremiumModule,
    QuizModule,
    AdminModule,
    HackerRoomModule,
    CertificateModule,
    CyberLabModule,
    TelegramModule,
  ],
  providers: [TelegramService],
})
export class AppModule { }