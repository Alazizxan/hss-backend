import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    username: string;
}