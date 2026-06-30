import { IsString } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    quizId: string;

    @IsString()
    text: string;
}