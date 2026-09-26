import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateActivationDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    code!: string;

    @IsString()
    @IsNotEmpty()
    fingerprint!: string;
}
