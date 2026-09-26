import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiModule } from 'src/ai/ai.module';
import { LinkAnalyzerService } from './link-analyzer.service';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [PrismaModule, AiModule, ActivityModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, LinkAnalyzerService],
})
export class AnalysisModule {}
