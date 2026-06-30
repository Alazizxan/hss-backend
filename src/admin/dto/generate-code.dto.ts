import { IsString } from 'class-validator';

export class GeneratePremiumCodeDto {
    @IsString()
    courseId: string;
}