import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') {
  async canActivate(context: any): Promise<boolean> {
    return (await super.canActivate(context)) as boolean;
  }
}