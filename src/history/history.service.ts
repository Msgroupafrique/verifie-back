import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListHistoryDto } from './dto/list-history.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Appareil non activé.');
    }

    const items = await this.prisma.analysisLog.findMany({
      where: {
        deviceId,
        history: {
          isNot: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        analysisType: true,
        riskLevel: true,
        confidence: true,
        createdAt: true,

        history: {
          select: {
            id: true,
            result: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      success: true,
      items,
    };
  }

  async getAllHistory({ page = 1, pageSize = 100, type, risk, confidence, from, to }: ListHistoryDto) {
  const where: Prisma.AnalysisLogWhereInput = {
    ...(type && { analysisType: type as any }),
    ...(risk && { riskLevel: risk as any }),
    ...(confidence && { confidence: confidence as any }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  const [logs, total] = await this.prisma.$transaction([
    this.prisma.analysisLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        analysisType: true,
        riskLevel: true,
        confidence: true,
        createdAt: true,
      },
    }),
    this.prisma.analysisLog.count({ where }),
  ]);

  return {
    data: logs.map((h) => ({
      id: h.id,
      type: h.analysisType,
      risk: h.riskLevel,
      confidence: h.confidence,
      date: h.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

  async deleteHistory(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Appareil non activé.');
    }

    const result = await this.prisma.analysisLog.deleteMany({
      where: { deviceId },
    });

    console.log('history deleted')

    return {
      success: true,
      deletedCount: result.count,
      message: 'Historique supprimé avec succès.',
    };
  }
}