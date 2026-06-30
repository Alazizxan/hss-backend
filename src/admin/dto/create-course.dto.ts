import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}