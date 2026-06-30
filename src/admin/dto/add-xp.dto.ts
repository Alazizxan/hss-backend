import { IsNumber, IsString } from 'class-validator';

export class AddXpDto {
    @IsString()
    userId: string;

    @IsNumber()
    xp: number;
}