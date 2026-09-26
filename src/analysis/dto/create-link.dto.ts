import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateLinkAnalysisDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'L’URL doit être valide et commencer par http:// ou https://.',
    },
  )
  url!: string;
}