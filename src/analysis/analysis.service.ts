import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GeminiService } from 'src/ai/gemini.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { CreateImageAnalysisDto } from './dto/create-image-analysis.dto';
import { LinkAnalyzerService } from './link-analyzer.service';
import { CreateLinkAnalysisDto } from './dto/create-link.dto';
import { CreatePaymentAnalysisDto } from './dto/create-paiement.dto';
import { Prisma } from 'generated/prisma/client';
import { ActivityService } from 'src/activity/activity.service';

export interface GeminiAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  observations: string[];
  actions: string[];
  thingsToAvoid: string[];
}

@Injectable()
export class AnalysisService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly linkAnalyzerService: LinkAnalyzerService,
    private readonly activityService: ActivityService
  ) {}

  //analyse du message
  async create(dto: CreateAnalysisDto) {
    const message = dto.message?.trim();

    if (!message) {
      throw new BadRequestException('Le message à analyser est obligatoire.');
    }

    // 1. Vérifier l'appareil
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException('Appareil non activé ou introuvable.');
    }

    // 2. Mettre à jour l'activité de l'appareil
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastActiveAt: new Date() },
    });

    // 3. Analyse Gemini
    const prompt = this.buildMessagePrompt(message);

    const aiResponse = await this.geminiService.generateText(prompt);

    // 4. Normaliser la réponse
    const result = this.parseGeminiResponse(aiResponse);

    // 5. Enregistrer l'analyse
    const analysisLog =
      await this.prisma.analysisLog.create({
        data: {
          deviceId: device.id,
          analysisType: 'MESSAGE',
          riskLevel: result.riskLevel,
          confidence: result.confidence,

          history: {
            create: {
              result: result as unknown as Prisma.InputJsonValue,
            }
          }
        },
      });

      await this.activityService.create({
        title: 'Nouvelle analyse.',
        description: "Analyse d'un message.",
        type: 'ANALYSIS'
      })

    // 6. Réponse API
    return {
      success: true,
      type: 'MESSAGE',
      analysisId: analysisLog.id,
      result,
    };
  }

  private buildMessagePrompt(message: string): string {
    return `
    Tu es le moteur d'analyse de l'application VÉRIFIE.

    Analyse le message suivant afin d'identifier les signaux pouvant nécessiter
    de la prudence : phishing, pression temporelle, demande d'argent,
    demande de codes, identifiants, informations personnelles, liens suspects,
    promesses inhabituelles ou autres signaux de risque.

    RÈGLES :
    - Ne certifie jamais qu'un message est frauduleux.
    - Ne garantis jamais qu'un message est fiable.
    - Base-toi uniquement sur les éléments observables.
    - Si les informations sont insuffisantes, utilise une confiance LOW.
    - Maximum 5 observations.
    - Maximum 3 actions.
    - Maximum 2 précautions.
    - Réponds UNIQUEMENT avec un JSON valide.
    - Aucun markdown.
    - Aucun texte avant ou après le JSON.

    FORMAT :

    {
      "riskLevel": "LOW | MEDIUM | HIGH",
      "confidence": "LOW | MEDIUM | HIGH",
      "summary": "Résumé court",
      "observations": ["..."],
      "actions": ["..."],
      "thingsToAvoid": ["..."]
    }

    Message :
    """
    ${message}
    """
    `;
  }

  private parseGeminiResponse(
    response: string,
  ): GeminiAnalysis {
    try {
      const cleaned = response
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      this.validateAnalysis(parsed);

      return parsed;
    } catch {
      throw new BadRequestException(
        "La réponse du moteur d'analyse est invalide.",
      );
    }
  }

  private validateAnalysis(
    result: unknown,
  ): asserts result is GeminiAnalysis {
    if (!result || typeof result !== 'object') {
      throw new Error('Format invalide');
    }

    const data = result as Record<string, unknown>;

    const validRiskLevels = [
      'LOW',
      'MEDIUM',
      'HIGH',
    ];

    const validConfidence = [
      'LOW',
      'MEDIUM',
      'HIGH',
    ];

    if (
      !validRiskLevels.includes(
        data.riskLevel as string,
      )
    ) {
      throw new Error('riskLevel invalide');
    }

    if (
      !validConfidence.includes(
        data.confidence as string,
      )
    ) {
      throw new Error('confidence invalide');
    }

    if (typeof data.summary !== 'string') {
      throw new Error('summary invalide');
    }

    if (!Array.isArray(data.observations)) {
      throw new Error('observations invalides');
    }

    if (!Array.isArray(data.actions)) {
      throw new Error('actions invalides');
    }

    if (!Array.isArray(data.thingsToAvoid)) {
      throw new Error('thingsToAvoid invalides');
    }

    if (data.observations.length > 5) {
      throw new Error('Trop d’observations');
    }

    if (data.actions.length > 3) {
      throw new Error('Trop d’actions');
    }

    if (data.thingsToAvoid.length > 2) {
      throw new Error('Trop de précautions');
    }
  }

  //analyse d'image

  async createImage(dto: CreateImageAnalysisDto, file: any) {
    if (!file) {
      throw new BadRequestException(
        'Aucune image n’a été fournie.',
      );
    }

    const device = await this.prisma.device.findUnique({
      where: {
        id: dto.deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Appareil non activé.',
      );
    }

    await this.prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    const prompt = `
      Tu es le moteur d'analyse de l'application VÉRIFIE.

      Analyse l'image fournie uniquement à des fins de prévention.

      Tu dois distinguer :
      - ce qui est directement observable ;
      - ce qui constitue un indice ;
      - ce qui nécessite une vérification externe.

      Ne prétends jamais qu'une information est certaine si l'image ne permet pas de le démontrer.

      Retourne UNIQUEMENT un JSON valide, sans markdown, avec exactement cette structure :

      {
        "riskLevel": "LOW | MEDIUM | HIGH",
        "confidence": "LOW | MEDIUM | HIGH",
        "summary": "résumé court",
        "observations": [],
        "actions": [],
        "thingsToAvoid": []
      }

      Contraintes :
      - observations : maximum 5 éléments
      - actions : maximum 3 éléments
      - thingsToAvoid : maximum 2 éléments
      - riskLevel doit refléter uniquement les signaux observables
      - confidence représente la confiance dans l'analyse
      - ne conclus pas qu'un paiement est réellement reçu uniquement parce qu'une capture d'écran le montre
      - si l'image est illisible ou insuffisante, indique-le clairement
      `;

    const rawResult = await this.geminiService.analyzeImage(
      file.buffer,
      file.mimetype,
      prompt,
    );

    const result = this.parseGeminiResponse(rawResult);

    const analysis = await this.prisma.analysisLog.create({
      data: {
        deviceId: device.id,
        analysisType: 'IMAGE',
        riskLevel: result.riskLevel,
        confidence: result.confidence,

        history: {
            create: {
              result: result as unknown as Prisma.InputJsonValue,
            }
          }
      },
    });

    await this.activityService.create({
      title: 'Nouvelle analyse.',
      description: "Analyse d'une image.",
      type: 'ANALYSIS'
    })

    return {
      success: true,
      type: 'IMAGE',
      analysisId: analysis.id,
      result,
    };
  } 

  //analyse d'un lien
  async createLink(dto: CreateLinkAnalysisDto) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: dto.deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Appareil non activé.',
      );
    }

    await this.prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    const result =
      this.linkAnalyzerService.analyze(dto.url);

    const analysis =
      await this.prisma.analysisLog.create({
        data: {
          deviceId: device.id,
          analysisType: 'LINK',
          riskLevel: result.riskLevel,
          confidence: result.confidence,

          history: {
            create: {
              result: result as unknown as Prisma.InputJsonValue,
            }
          }
        },
      });

    await this.activityService.create({
      title: 'Nouvelle analyse.',
      description: "Analyse d'un lien.",
      type: 'ANALYSIS'
    })

    return {
      success: true,
      type: 'LINK',
      analysisId: analysis.id,
      result,
    };
  }

  //analyse d'un paiement
  async createPayment(dto: CreatePaymentAnalysisDto, file: any) {
    if (!file) {
      throw new BadRequestException(
        "Aucune capture ou image de paiement n'a été fournie.",
      );
    }

    const device = await this.prisma.device.findUnique({
      where: {
        id: dto.deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Appareil non activé.',
      );
    }

    await this.prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    const context = dto.context?.trim() || 'Aucun contexte supplémentaire fourni.';

    const prompt = `
      Tu es le moteur d'analyse préventive de l'application VÉRIFIE.

      Analyse cette image qui peut représenter une preuve ou une confirmation de paiement.

      CONTEXTE UTILISATEUR :
      ${context}

      RÈGLE ABSOLUE :
      Une capture d'écran, un SMS, un reçu affiché ou une confirmation visuelle
      ne constitue PAS une preuve certaine que l'argent a réellement été crédité
      sur le compte du bénéficiaire.

      Tu dois uniquement analyser les éléments observables dans l'image.

      Recherche notamment :
      - incohérences visuelles ;
      - informations manquantes ;
      - montants ;
      - dates et heures ;
      - références de transaction ;
      - nom du bénéficiaire ;
      - statut affiché ;
      - éléments inhabituels ;
      - signes possibles de modification ou de manipulation ;
      - incohérences entre les différentes informations visibles.

      Ne prétends jamais pouvoir confirmer réellement la réception des fonds.

      Retourne UNIQUEMENT un JSON valide, sans markdown :

      {
        "riskLevel": "LOW | MEDIUM | HIGH",
        "confidence": "LOW | MEDIUM | HIGH",
        "summary": "résumé court",
        "observations": [],
        "actions": [],
        "thingsToAvoid": []
      }

      Contraintes :
      - observations : maximum 5
      - actions : maximum 3
      - thingsToAvoid : maximum 2
      - riskLevel = niveau de prudence recommandé selon les signaux observables
      - confidence = confiance dans l'analyse de l'image
      - si l'image est illisible, indique-le
      - ne dis jamais que le paiement est définitivement reçu
      - ne dis jamais qu'un paiement est définitivement faux uniquement sur la base de l'image
      `;

    const rawResult =
      await this.geminiService.analyzeImage(
        file.buffer,
        file.mimetype,
        prompt,
      );

    const result =
      this.parseGeminiResponse(rawResult);

    const analysis =
      await this.prisma.analysisLog.create({
        data: {
          deviceId: device.id,
          analysisType: 'PAY_CHECK',
          riskLevel: result.riskLevel,
          confidence: result.confidence,

          history: {
            create: {
              result: result as unknown as Prisma.InputJsonValue,
            }
          }
        },
      });

      await this.activityService.create({
        title: 'Nouvelle analyse.',
        description: "Vérification d'un paiement.",
        type: 'ANALYSIS'
      })

    return {
      success: true,
      type: 'PAYMENT',
      analysisId: analysis.id,
      result,
    };
  }
}