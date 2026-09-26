import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { randomBytes } from 'crypto';
import { Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';

interface KeyGenerationJobData {
  expiresAt: Date | null;
  total: number;
  batchSize: number;
  created?: number;
}

@Processor('activation-keys')
export class KeyGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(
    KeyGenerationProcessor.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {
    super();
  }

  async process(job: Job<KeyGenerationJobData>) {
    const {
      expiresAt,
      total,
      batchSize,
    } = job.data;

    let totalCreated = job.data.created ?? 0;

    const startedAt = Date.now();

    this.logger.log(`Début de génération du job ${job.id} : ${total} clés`);

    while (totalCreated < total) {
      const remaining = total - totalCreated;

      const currentBatchSize = Math.min(batchSize, remaining);

      const codes = this.generateUniqueCodes(currentBatchSize);

      const result = await this.prisma.activationKey.createMany({
        data: codes.map((code) => ({
          code,
          status: 'ACTIVE',
          expiresAt,
        })),
        skipDuplicates: true,
      });

      totalCreated += result.count;
      await job.updateData({ ...job.data, created: totalCreated });
      const percentage = Math.min(100, Number(((totalCreated / total) * 100).toFixed(2)));
      await job.updateProgress(percentage);

      this.logger.log(`Job ${job.id} — ${percentage}%`);
    }

    const durationMs = Date.now() - startedAt;

    await this.activityService.create({
      type: 'KEY_GENERATED',
      title: 'Nouvelle génération de clés',
      description: `${total.toLocaleString('fr-FR')} clés générées`,
    })

    this.logger.log(`Génération terminée : ${totalCreated} clés en ${durationMs} ms`);

    return {
      success: true,
      count: totalCreated,
      total,
      percentage: 100,
      durationMs,
      expiresAt,
    };
  }

  private generateUniqueCodes(
    quantity: number,
  ): string[] {
    const codes = new Set<string>();

    while (codes.size < quantity) {
      codes.add(
        this.generateActivationCode(),
      );
    }

    return [...codes];
  }

  private generateActivationCode(): string {
    const part1 = randomBytes(3)
      .toString('hex')
      .toUpperCase();

    const part2 = randomBytes(3)
      .toString('hex')
      .toUpperCase();

    const part3 = randomBytes(3)
      .toString('hex')
      .toUpperCase();

    return `VER-${part1}-${part2}-${part3}`;
  }
}