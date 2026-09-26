import { PartialType } from '@nestjs/swagger';
import { CreateActivationDto } from './create-activation.dto';

export class UpdateActivationDto extends PartialType(CreateActivationDto) {}
