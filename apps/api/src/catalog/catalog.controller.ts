import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async findAll() {
    return await this.catalogService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.catalogService.findOne(id);
  }
}
