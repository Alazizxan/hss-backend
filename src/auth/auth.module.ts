import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Bularni qo'shing

@Module({
  imports: [
    UsersModule,
    // registerAsync ishlatamiz
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule ni import qilish shart
      inject: [ConfigService], // ConfigService ni inject qilish shart
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule { }