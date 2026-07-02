import { PartialType } from '@nestjs/mapped-types';
import { CreateCyberLabDto } from '../create-cyber-lab.dto';

export class UpdateCyberLabDto extends PartialType(
    CreateCyberLabDto,
) { }