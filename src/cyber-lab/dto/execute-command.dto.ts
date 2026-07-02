import { IsString } from 'class-validator';

export class ExecuteCommandDto {
    @IsString()
    sessionId: string;

    @IsString()
    command: string;
}