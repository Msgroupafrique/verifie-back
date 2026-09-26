import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { KeyGenerationProcessor } from './processors/key-generation.processor';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'activation-keys',
    }),
    PrismaModule,
    ActivityModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, KeyGenerationProcessor],
  exports: [AdminService],
})
export class AdminModule {}