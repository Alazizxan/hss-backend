import { Body, Controller, Get, Req, UseGuards, Delete, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UsersService } from './users.service';
import { Patch } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';


@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: any) {
        const userId = req.user.userId;

        return this.usersService.findById(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('leaderboard')
    leaderboard() {
        return this.usersService.findLeaderboard();
    }


    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req) {
        return this.usersService.getProfile(req.user.userId);
    }


    @UseGuards(JwtAuthGuard)
    @Get('dashboard')
    getDashboard(@Req() req) {
        return this.usersService.getDashboard(req.user.userId);
    }


    @UseGuards(JwtAuthGuard)
    @Get('courses')
    getMyCourses(@Req() req) {
        return this.usersService.getMyCourses(
            req.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    updateProfile(
        @Req() req,
        @Body() body: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(
            req.user.userId,
            body.username,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('password')
    changePassword(
        @Req() req,
        @Body() body: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(
            req.user.userId,
            body.oldPassword,
            body.newPassword,
        );
    }


    @UseGuards(JwtAuthGuard)
    @Delete('me')
    deleteAccount(
        @Req() req,
        @Body() body: DeleteAccountDto,
    ) {
        return this.usersService.deleteAccount(
            req.user.userId,
            body.password,
        );
    }

    @Get('check-username/:username')
    async checkUsername(
        @Param('username') username: string,
    ) {
        return this.usersService.checkUsername(username);
    }


}