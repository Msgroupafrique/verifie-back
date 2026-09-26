import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type Request } from 'express';

const cookieExtractor = (req: Request): string | null =>
  req?.cookies?.refresh_token ?? null;

@Injectable()
export class RefreshStrategy extends PassportStrategy(
  Strategy,
  'refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,                          // back-office web
        ExtractJwt.fromBodyField('refreshToken'), // mobile
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(
        'JWT_REFRESH_SECRET',
      ),
      passReqToCallback: true,
    });
  }

  async validate(payload: {sub: string; email: string | null}) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}