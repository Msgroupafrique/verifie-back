import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentAnalysisDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  context?: string;
}