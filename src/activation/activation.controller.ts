import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActivationService } from './activation.service';
import { CreateActivationDto } from './dto/create-activation.dto';
import { UpdateActivationDto } from './dto/update-activation.dto';

@Controller('activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Post()
  activate(@Body() dto: CreateActivationDto) {
    console.log('device and fingerprint: ', dto)
    return this.activationService.activate(dto);
  }

  @Get('status/:deviceId')
  async checkStatus(@Param('deviceId') deviceId: string) {
    console.log('device: ', deviceId)
    return this.activationService.checkStatus(deviceId);
  }

}
