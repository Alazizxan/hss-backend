import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateCourseDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsBoolean()
    isPremium?: boolean;

    @IsOptional()
    @IsInt()
    xpReward?: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    level?: string;
}