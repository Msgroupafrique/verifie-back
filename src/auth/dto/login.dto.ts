import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'L’adresse email doit être valide.' })
  @IsNotEmpty({ message: 'L’adresse email est obligatoire.' })
  email!: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password!: string;
}