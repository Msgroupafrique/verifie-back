import { Controller, Get } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('recent')
  async getRecent() {
    return this.activityService.findRecent()
  }
}
