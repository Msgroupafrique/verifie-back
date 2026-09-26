import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateKeyDto {

  /*@IsInt({ message: 'La quantité doit être un nombre entier.'})
   @Min(1, {  message: 'La quantité minimale est de 1.'})
  @Max(10000000, {  message: 'La quantité maximale est de 100.'})
  quantity!: number;*/

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresInDays?: number;
}