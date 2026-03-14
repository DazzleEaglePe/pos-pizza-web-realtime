import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { BusinessConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('config')
export class BusinessConfigController {
  constructor(private readonly configService: BusinessConfigService) {}

  @Get()
  async getPublicConfig() {
    const taxRate = await this.configService.getTaxRatePercent();
    return { taxRate };
  }

  @Get('full')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getFullConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateConfig(
    @Body()
    body: Partial<{
      companyName: string;
      ruc: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      taxRateDefault: number;
      currency: string;
      timezone: string;
      ticketHeader: string | null;
      ticketFooter: string | null;
      trackingBaseUrl: string | null;
      trackingExpiryHours: number;
      logoUrl: string | null;
    }>,
  ) {
    return this.configService.updateConfig(body);
  }
}
