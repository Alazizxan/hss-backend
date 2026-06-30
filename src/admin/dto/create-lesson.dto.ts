import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    type: 'TEXT' | 'VIDEO' | 'IMAGE';

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsNumber()
    order: number;

    @IsOptional()
    @IsNumber()
    xpReward?: number;

    @IsString()
    sectionId: string;
}