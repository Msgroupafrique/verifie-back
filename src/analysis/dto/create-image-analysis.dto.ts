import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateImageAnalysisDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId!: string;
}