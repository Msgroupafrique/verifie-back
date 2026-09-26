import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name)

    private readonly ai: GoogleGenAI;
    private readonly model: string;

    constructor (private readonly configService: ConfigService) {
        const apiKey = configService.get<string>('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error(
                'GEMINI_API_KEY est manquant  !'
            )
        }
        
        this.ai = new GoogleGenAI({apiKey});
        this.model = configService.get<string>('GEMINI_MODEL') ?? 'gemini-flash-lite-latest';
    }

    async generateText(prompt: string) {
        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
            });

            const text = response.text?.trim();

            if (!text) {
                throw new InternalServerErrorException("Gemini n'a retourné  aucun contenu.");
            }

            return text;

        } catch (error) {
            this.logger.error(
                "Erreur lors de l'appel à Gemini",
                error instanceof Error ? error.stack : error,
            );

            if (error instanceof InternalServerErrorException) {
                throw error;
            }

            throw new InternalServerErrorException ("Impossible de réaliser l'analyse IA pour le moment.")
        }
    }

    async analyzeImage(imageBuffer: Buffer, mimeType: string, prompt: string): Promise<string> {
        try {
            const base64Image = imageBuffer.toString('base64');

            const response = await this.ai.models.generateContent({
            model: this.model,
            contents: [
                {
                role: 'user',
                parts: [
                    {
                    text: prompt,
                    },
                    {
                    inlineData: {
                        mimeType,
                        data: base64Image,
                    },
                    },
                ],
                },
            ],
            });

            const text = response.text?.trim();

            if (!text) {
            throw new InternalServerErrorException(
                "Gemini n'a retourné aucun contenu.",
            );
            }

            return text;
        } catch (error) {
            this.logger.error(
            "Erreur lors de l'analyse de l'image",
            error instanceof Error ? error.stack : error,
            );

            if (error instanceof InternalServerErrorException) {
            throw error;
            }

            throw new InternalServerErrorException(
            "Impossible de réaliser l'analyse de l'image pour le moment.",
            );
        }
    }
}