import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ActivationModule } from './activation/activation.module';
import { AnalysisModule } from './analysis/analysis.module';
import { HistoryModule } from './history/history.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserSessionModule } from './user-session/user-session.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StatsModule } from './stats/stats.module';
import { BullModule } from '@nestjs/bullmq';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /*BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      }
    }),*/

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        if (redisUrl) {
          return {
            connection: {
              url: redisUrl,
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          connection: {
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    PrismaModule, 
    ActivationModule, 
    AnalysisModule, 
    HistoryModule, 
    AdminModule, 
    AiModule, AuthModule, UserSessionModule, UsersModule, StatsModule, ActivityModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
