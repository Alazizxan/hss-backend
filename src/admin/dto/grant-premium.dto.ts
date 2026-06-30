import { IsString } from 'class-validator';

export class GrantPremiumDto {
    @IsString()
    userId: string;
}
