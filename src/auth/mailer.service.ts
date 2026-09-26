import { Injectable } from "@nestjs/common";
import PasswordResetEmail from "src/common/template/reset-password.template";
import * as React from 'react';
import { Resend } from 'resend'
import { ConfigService } from "@nestjs/config";


@Injectable()
export class MailerService {
    private resend: Resend;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(configService.getOrThrow<string>('RESEND_API_KEY'))
    }

    async sendResetPasswordEmail (to: string, resetLink: string) {
        try {
            
            const { data, error } = await this.resend.emails.send({
                from: 'Acme <onboarding@resend.dev>',
                to: [to],
                subject: 'Réinitialisation de votre mot de passe',

                react: React.createElement(PasswordResetEmail, {
                    companyName: 'VERIFIE',
                    url: resetLink,
                })
            })

            console.log('email envoye...')

        } catch (error: any) {
            throw new Error(`Erreur d'envoi: ${error.message}`)
        }
    }
}