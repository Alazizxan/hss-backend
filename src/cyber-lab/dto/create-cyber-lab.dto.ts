import {
    IsArray,
    IsBoolean,
    IsObject,
    IsOptional,
    IsString,
    IsInt,
} from 'class-validator';

export class CreateCyberLabDto {
    @IsString()
    code: string;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsString()
    difficulty: string;

    @IsString()
    briefing: string;

    @IsString()
    hostname: string;

    @IsString()
    username: string;

    @IsObject()
    fileSystem: Record<string, any>;

    @IsObject()
    metadata: Record<string, any>;

    @IsArray()
    objectives: string[];

    @IsArray()
    flags: string[];

    @IsBoolean()
    isPublished: boolean;

    @IsOptional()
    @IsInt()
    xpReward?: number;

    @IsOptional()
    @IsInt()
    estimatedTime?: number;
}