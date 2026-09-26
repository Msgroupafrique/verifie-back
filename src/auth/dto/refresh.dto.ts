import { IsJWT, IsOptional } from 'class-validator';

export class RefreshDto {
  @IsOptional()
  @IsJWT({ message: 'Refresh token invalide.' })
  refreshToken?: string;
}