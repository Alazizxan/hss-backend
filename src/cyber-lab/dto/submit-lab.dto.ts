import {
    IsObject,
    IsString,
    IsUUID,
} from 'class-validator';

export class SubmitLabDto {
    @IsUUID()
    sessionId: string;

    @IsObject()
    answers: Record<string, any>;

    @IsString()
    report: string;
}