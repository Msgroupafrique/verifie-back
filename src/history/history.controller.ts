import { Controller, Get, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ListHistoryDto } from './dto/list-history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllHistory(@Query() query: ListHistoryDto) {
    return this.historyService.getAllHistory(query);
  }

  @Get(':deviceId')
  GetHistory (@Param('deviceId') deviceId: string) {
    return this.historyService.getHistory(deviceId)
  }

  @Delete(':deviceId')
  DeleteHistory (@Param('deviceId') deviceId: string) {
    return this.historyService.deleteHistory(deviceId)
  }
}
