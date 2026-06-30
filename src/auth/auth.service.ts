import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(
        username: string,
        email: string,
        password: string,
    ) {
        const existEmail =
            await this.usersService.findByEmail(email);

        if (existEmail) {
            throw new BadRequestException(
                'Email already exists',
            );
        }

        const existUsername =
            await this.usersService.findByUsername(username);

        if (existUsername) {
            throw new BadRequestException(
                'Username already exists',
            );
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await this.usersService.create({
            username,
            email,
            passwordHash: hash,
        });

        return this.generateToken(
            user.id,
            user.email,
            user.role,
        );
    }

    async login(
        email: string,
        password: string,
    ) {
        const user =
            await this.usersService.findByEmail(email);

        if (!user) {
            throw new BadRequestException(
                'User not found',
            );
        }

        const isMatch = await bcrypt.compare(
            password,
            user.passwordHash,
        );

        if (!isMatch) {
            throw new BadRequestException(
                'Invalid credentials',
            );
        }

        return this.generateToken(
            user.id,
            user.email,
            user.role,
        );
    }

    private generateToken(
        userId: string,
        email: string,
        role: string,
    ) {
        return {
            access_token: this.jwtService.sign({
                sub: userId,
                email,
                role,
            }),
        };
    }
}