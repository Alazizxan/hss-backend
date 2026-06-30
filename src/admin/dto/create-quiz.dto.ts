import { IsString } from 'class-validator';

export class CreateQuizDto {
    @IsString()
    title: string;

    @IsString()
    lessonId: string;
}