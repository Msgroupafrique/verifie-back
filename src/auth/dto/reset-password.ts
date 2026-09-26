import { IsNotEmpty, IsString } from "class-validator";

export class ResetPassword {
    @IsString()
    @IsNotEmpty()
    token!: string;

    @IsString()
    password!: string;
}