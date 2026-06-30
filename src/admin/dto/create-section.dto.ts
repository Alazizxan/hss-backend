import { IsNumber, IsString } from 'class-validator';

export class CreateSectionDto {
    @IsString()
    title: string;

    @IsString()
    courseId: string;

    @IsNumber()
    order: number;
}