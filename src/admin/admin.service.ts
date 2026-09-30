import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKeyDto } from './dto/create-key.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ListKeysDto } from './dto/list-keys.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,

    @InjectQueue('activation-keys')
    private readonly activationQueue: Queue,
  ) { }

  private readonly BATCH_SIZE = 1_000;
  private readonly TOTAL_KEYS_TO_GENERATE = 1_000_000;

  private readonly logger = new Logger(AdminService.name)

  async createActivationKey(dto: CreateKeyDto, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { 
        id: true,
        userRole: true,
      },
    });

    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.userRole)) {
      throw new ForbiddenException(
        'Cet utilisateur ne possède pas de compte administrateur.',
      );
    }

    let expiresAt: Date | null = null;

    if (dto.expiresInDays) {
      expiresAt = new Date();

      expiresAt.setDate(expiresAt.getDate() + dto.expiresInDays);
      //expiresAt.setMinutes(expiresAt.getMinutes() + dto.expiresInDays);
    }

    const job = await this.activationQueue.add(
      'generate-activation-keys',
      {
        expiresAt,
        total: this.TOTAL_KEYS_TO_GENERATE,
        batchSize: this.BATCH_SIZE,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Job de génération créé : ${job.id}`,
    );

    return {
      success: true,
      jobId: job.id,
      status: 'QUEUED',
      total: this.TOTAL_KEYS_TO_GENERATE,
      percentage: 0,
      expiresAt,
    };
  };

  async findAll({ page = 1, pageSize = 100, search, status }: ListKeysDto) {

    const where: Prisma.ActivationKeyWhereInput = {
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { code: { startsWith: search.toUpperCase() } },
          { devices: { fingerprint: { contains: search } } },
        ],
      }),
    };

    const [keys, total] = await this.prisma.$transaction([
      this.prisma.activationKey.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          code: true,
          status: true,
          devices: { select: { fingerprint: true } },
          createdAt: true,
          expiresAt: true,
        },
      }),
      this.prisma.activationKey.count({ where }),
    ]);

    return {
      data: keys.map((key) => ({
        id: key.id,
        code: key.code,
        status: key.status,
        device: key.devices?.fingerprint ?? '_',
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      })),
      total,
      page,
      pageSize,
    };

  }

  //expiration automatique
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiresKey() {
    const where: Prisma.ActivationKeyWhereInput = {
      status: { in: ['ACTIVE', 'USED'] },
      expiresAt: { lt: new Date() },
    };

    const [devices, keys] = await this.prisma.$transaction([
      this.prisma.device.updateMany({
        where: { isActive: true, activationKey: where },
        data: { isActive: false },
      }),
      this.prisma.activationKey.updateMany({
        where,
        data: { status: 'EXPIRED' },
      }),
    ]);

    if (keys.count > 0) {
      this.logger.log(`${keys.count} clés expirées, ${devices.count} appareils désactivés.`);
    }
  }

  async getGenerationJobStatus(jobId: string) {
    const job = await this.activationQueue.getJob(jobId); 
    if (!job) { 
      throw new NotFoundException(`Le job de génération ${jobId} est introuvable.`); 
    } 
    const state = await job.getState(); 
    const progress = typeof job.progress === 'number' ? job.progress : 0; 
    return {
      jobId: job.id, 
      name: job.name, 
      status: state, 
      progress,
      failedReason: job.failedReason ?? null, 
      data: { 
        total: job.data.total, 
        batchSize: job.data.batchSize, 
        expiresAt: job.data.expiresAt, 
      },
    } 
  }


  async deleteUnusedKeys({
    dryRun = true,
    batchSize = 1000,
    createdAfter,
  }: {
    dryRun?: boolean;
    batchSize?: number;
    createdAfter?: Date; 
  } = {}) {
    const where: Prisma.ActivationKeyWhereInput = {
      devices: null, 
      ...(createdAfter ? { createdAt: { gte: createdAfter } } : {}),
    };

    const total = await this.prisma.activationKey.count({ where });

    if (dryRun) {
      return { dryRun: true, wouldDelete: total };
    }

    let deleted = 0;
    while (deleted < total) {
      const batch = await this.prisma.activationKey.findMany({
        where,
        select: { id: true },
        take: batchSize,
      });

      if (batch.length === 0) break;

      const { count } = await this.prisma.activationKey.deleteMany({
        where: { id: { in: batch.map((k) => k.id) } },
      });

      deleted += count;
      this.logger.log(`Suppression clés test: ${deleted}/${total}`);

      // petite pause pour ne pas saturer la connexion Postgres sur Render Hobby
      await new Promise((r) => setTimeout(r, 200));
    }

    return { dryRun: false, deleted };
  }

  // Extrait à ajouter dans ton ActivationService (ou AdminService) NestJS

  async deleteAllKeys({
    dryRun = true,
    batchSize = 1000,
  }: {
    dryRun?: boolean;
    batchSize?: number;
  } = {}) {
    const total = await this.prisma.activationKey.count();

    if (dryRun) {
      return { dryRun: true, wouldDelete: total };
    }

    let deleted = 0;
    while (deleted < total) {
      const batch = await this.prisma.activationKey.findMany({
        select: { id: true },
        take: batchSize,
      });

      if (batch.length === 0) break;

      const { count } = await this.prisma.activationKey.deleteMany({
        where: { id: { in: batch.map((k) => k.id) } },
      });

      deleted += count;
      this.logger.log(`Suppression totale clés: ${deleted}/${total}`);

      await new Promise((r) => setTimeout(r, 200));
    }

    return { dryRun: false, deleted };
  }
}