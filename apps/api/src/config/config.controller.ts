import { Controller, Get } from '@nestjs/common';
import { BusinessConfigService } from './config.service';

@Controller('config')
export class BusinessConfigController {
  constructor(private readonly configService: BusinessConfigService) {}

  @Get()
  async getPublicConfig() {
    const taxRate = await this.configService.getTaxRatePercent();
    return { taxRate };
  }
}
