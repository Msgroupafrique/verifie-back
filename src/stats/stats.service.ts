import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {

    constructor(
        private readonly prisma: PrismaService,
    ) {}

    //analyses recentes
  async getRecentAnalyses() {
    const histories = await this.prisma.analysisLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        analysisType: true,
        riskLevel: true,
        confidence: true,
        createdAt: true,
      }
    })

    return histories.map((history) => {
      return {
        id: history.id,
        type: history.analysisType,
        risk: history.riskLevel,
        confidence: history.confidence,
        date: history.createdAt,
      }
    })
  }

  //statistiques des analyses
  async getAnalysesStats () {
    const [total, low, medium, high] = await Promise.all([
      this.prisma.analysisLog.count(),
      this.prisma.analysisLog.count({ where: { riskLevel: 'LOW' } }),
      this.prisma.analysisLog.count({ where: { riskLevel: 'MEDIUM' }}),
      this.prisma.analysisLog.count({ where: { riskLevel: 'HIGH' }}),
    ]);

    return [
      { type: 'TOTAL', value: total.toString() },
      { type: 'LOW', value: low.toString() },
      { type: 'MEDIUM', value: medium.toString() },
      { type: 'HIGH', value: high.toString() },
    ]
  }

  //statistiques des cles
  async getKeyStats() {

    const [total, active, used, expired] = await Promise.all([
      this.prisma.activationKey.count(),
      this.prisma.activationKey.count({ where: { status: 'ACTIVE' } }),
      this.prisma.activationKey.count({ where: { status: 'USED' } }),
      this.prisma.activationKey.count({ where: { status: 'EXPIRED' } }),
    ]);

    return [
      { type: 'TOTAL', value: total.toString() },
      { type: 'ACTIVE', value: active.toString() },
      { type: 'USED', value: used.toString() },
      { type: 'EXPIRED', value: expired.toString() },
    ];
  }  

  //statistiques gloables
  async getGlobalStats () {
    const [ totalKey, usedKey, activeKey, totalAnalyses ] = await Promise.all([
        this.prisma.activationKey.count(),
        this.prisma.activationKey.count({ where: { status: 'USED' } }),
        this.prisma.activationKey.count({ where: { status: 'ACTIVE' } }),
        this.prisma.analysisLog.count(),
    ])

    return [
        { type: 'TOTAL_KEY', value: totalKey.toString() },
        { type: 'USED_KEY', value: usedKey.toString() },
        { type: 'ACTIVE_KEY', value: activeKey.toString() },
        { type: 'TOTAL_ANALYSES', value: totalAnalyses.toString() },
    ]
  }

}
