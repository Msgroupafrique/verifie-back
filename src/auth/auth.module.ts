import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { UserSessionModule } from 'src/user-session/user-session.module';
import { UsersModule } from 'src/users/users.module';
import { MailerService } from './mailer.service';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [
    PrismaModule,
    UserSessionModule,
    UsersModule,
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('JWT_EXPIRES_IN')!
        }
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailerService,
    LocalStrategy,
    JwtStrategy,
    RefreshStrategy,
    AdminSeedService,

    {
      provide: 'REFRESH_JWT_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
          signOptions: {
            expiresIn: configService.getOrThrow(
              'JWT_REFRESH_EXPIRES_IN',
            ),
          },
        });
      },
    },
  ],
  exports: [AuthService, MailerService, AdminSeedService]
})
export class AuthModule {}
