import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPassword {
    @IsEmail({}, { message: "Le format de l'email est invalide."})
    @IsNotEmpty({ message: "L'adresse email est obligatoire pour envoyer le lien."})
    email!: string;
}