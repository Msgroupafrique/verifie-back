import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateActivationDto } from './dto/create-activation.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(dto: CreateActivationDto) {
    const code = dto.code.trim().toUpperCase();
    const fingerprint = dto.fingerprint.trim();

    if (!code || !fingerprint) {
      throw new BadRequestException("Le code et l'identifiant de l'appareil sont obligatoires.");
    }

    return this.prisma.$transaction(async (tx) => {
      const key = await tx.activationKey.findUnique({
        where: { code },
        include: {
          devices: true,
        },
      });

      if (!key) {
        throw new NotFoundException(
          "Clé d'activation introuvable.",
        );
      }

      // Vérification de l'expiration
      if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException("Cette clé d'activation a expiré.");
      }

      /*
       * Une clé déjà associée à cet appareil
       * reste valide pour cet appareil.
       */
      if (key.devices) {
        if (key.devices.fingerprint !== fingerprint) {
          throw new BadRequestException('Cette clé est déjà associée à un autre appareil.');
        }

        // Une clé révoquée ou expirée ne peut pas être réactivée.
        if (key.status === 'REVOKED' || key.status === 'EXPIRED') {
          throw new BadRequestException("Cette clé d'activation n'est plus valide.");
        }

        await tx.device.update({
          where: {  id: key.devices.id },
          data: {
            lastActiveAt: new Date(),
          },
        });

        return {
          success: true,
          activated: true,
          deviceId: key.devices.id,
          message: 'Appareil déjà activé.',
        };
      }

      // Une clé USED ne peut pas être associée à un nouvel appareil.
      if (key.status !== 'ACTIVE') {
        throw new BadRequestException("Cette clé d'activation n'est plus disponible.");
      }

      // Première activation
      const device = await tx.device.create({
        data: {
          fingerprint,
          activationKeyId: key.id,
        },
      });

      // La clé devient immédiatement USED
      await tx.activationKey.update({
        where: {
          id: key.id,
        },
        data: {
          status: 'USED',
          activatedAt: new Date(),
        },
      });

      return {
        success: true,
        activated: true,
        deviceId: device.id,
        message: 'Appareil activé avec succès.',
      };
    });
  }

  async checkStatus(deviceId: string) {
    if (!deviceId?.trim()) {
      throw new BadRequestException(`L'identifiant de l'appareil est obligatoire`);
    }

    const device = await this.prisma.device.findUnique({
      where: { id: deviceId.trim() },
      include: {
        activationKey: true,
      },
    });

    if (!device) {
      return {
        success: true,
        active: false,
        status: 'NOT_FOUND',
        message: 'Appareil introuvable.',
      };
    }

    const key = device.activationKey;
    if(!device.isActive) {
      return {
        success: true,
        active: false,
        status: 'INACTIVE',
        message: "Cet appareil n'est plus actif.",
      };
    }

    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
      return {
        success: true,
        active: false,
        status: 'EXPIRED',
        message: "Cette cle d'activation a expire.",
      };
    }

    await this.prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return {
      success: true,
      active: true,
      status: 'ACTIVE',
      message: "Appareil actif.",
    };
  }
}