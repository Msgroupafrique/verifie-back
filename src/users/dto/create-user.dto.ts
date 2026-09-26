import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: "Le nom est obligatoire." })
    name?: string;

    @IsEmail({}, { message: "L'adresse email doit être valide." })
    @IsNotEmpty({ message: "L'adresse email est obligatoire." })
    email!: string;

    @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
    @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
    @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
    })
    password!: string;
}
