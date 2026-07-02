import {
    IsString,
    IsUUID,
    IsOptional,
    IsInt,
} from 'class-validator';

export class CreateRuleDto {
    @IsUUID()
    labId: string;

    @IsString()
    name: string;

    @IsString()
    triggerType: string;

    @IsString()
    triggerValue: string;

    @IsString()
    rewardFlag: string;

    @IsOptional()
    @IsInt()
    xpReward?: number;
}