import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPassword } from './dto/forgot-password';
import { ResetPassword } from './dto/reset-password';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Request() req: any,
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(req.user);

    console.log('tentative de login : ', req.user)

    res.cookie('refresh_token',
      result.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:
          process.env.NODE_ENV === 'production'
            ? 'none'
            : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    );

    return result;
  }

  @Post('refresh')
  async refresh(
    @Request() req: any,
    @Body() refreshDto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = refreshDto.refreshToken ?? req.cookies?.refresh_token;

    console.log('tente de rafraichir: ', refreshToken)

    const result = await this.authService.refresh(refreshToken);

    res.cookie('refresh_token', result.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:
          process.env.NODE_ENV === 'production'
            ? 'none'
            : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    );

    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: any) {
    return req.user;
  }

  @Post('logout')
  async logout(
    @Body() refreshDto: RefreshDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = refreshDto.refreshToken ?? req.cookies?.refresh_token;

    const result = await this.authService.logout(refreshToken);

    console.log('tentation de deconnexion : ', refreshToken)

    res.clearCookie('refresh_token',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:
          process.env.NODE_ENV === 'production'
            ? 'none'
            : 'lax',
        path: '/',
      },
    );

    return result;
  }

  @Post('forgot-password')
  ForgotPassword(@Body() forgotPasswordDto: ForgotPassword) {
    console.log("email recu :", forgotPasswordDto.email)
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post('reset-password')
  ResetPassword(@Body() resetPasswordDto: ResetPassword) {
    console.log("token et password recu : ", resetPasswordDto)
    return this.authService.resetPassword(resetPasswordDto)
  }
}
