import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateKeyDto } from './dto/create-key.dto';
import { ListKeysDto } from './dto/list-keys.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}


  @UseGuards(JwtAuthGuard)
  @Post('keys')
  createKey(
    @Body() dto: CreateKeyDto,
    @Req() request: any,
  ) {
    //console.log(dto)
    return this.adminService.createActivationKey(
      dto,
      request.user.id,
    );
  }
  
 @Get('keys')
findAll(@Query() query: ListKeysDto) {
  return this.adminService.findAll(query);
}

  @Get('keys/generation/:jobId') 
  async getGenerationJobStatus( @Param('jobId') jobId: string, ) { 
    return this.adminService.getGenerationJobStatus(jobId); 
  }

  @Delete('keys/test')
  @UseGuards(JwtAuthGuard)
  deleteTestKeys() {
    return this.adminService.deleteTestKeys();
  }

}