import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PrinterService } from './printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('printers')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Get()
  findAll() {
    return this.printerService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.printerService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.printerService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.printerService.remove(id);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string) {
    return this.printerService.setDefault(id);
  }
}
