import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { CreateImageAnalysisDto } from './dto/create-image-analysis.dto';
import { CreateLinkAnalysisDto } from './dto/create-link.dto';
import { CreatePaymentAnalysisDto } from './dto/create-paiement.dto';


@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  //endpoint pour message
  @Post('message')
  create(@Body() createAnalysisDto: CreateAnalysisDto) {
    return this.analysisService.create(createAnalysisDto);
  }

  //endpoint pour image
  @Post('image')
  @UseInterceptors(
  FileInterceptor('image', {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }))
  createImage(@UploadedFile() file: any, @Body() dto: CreateImageAnalysisDto) {
    return this.analysisService.createImage(dto, file);
  }

  //endpoint pour le lien
  @Post('link')
  createLink(
    @Body() dto: CreateLinkAnalysisDto,
  ) {
    return this.analysisService.createLink(dto);
  }

  //endpoint pour paiement (avant de payer)
  @Post('payment')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  createPayment(
    @UploadedFile() file: any,
    @Body() dto: CreatePaymentAnalysisDto,
  ) {
    return this.analysisService.createPayment(dto, file);
  }

}
