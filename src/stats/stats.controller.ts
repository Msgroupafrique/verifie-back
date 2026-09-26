import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('recent-analyses')
  @UseGuards(JwtAuthGuard)
  GetRecentAnalyses () {
    return this.statsService.getRecentAnalyses()
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  GetKeys () {
    return this.statsService.getKeyStats()
  }

  @Get('analyses')
  @UseGuards(JwtAuthGuard)
  GetAnalyses() {
    return this.statsService.getAnalysesStats();
  }

  @Get('global')
  @UseGuards(JwtAuthGuard)
  GetGlobal() {
    return this.statsService.getGlobalStats();
  }    
}
