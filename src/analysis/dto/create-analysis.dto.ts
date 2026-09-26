import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  message!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  deviceId!: string;
}