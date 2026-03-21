import { Body, Controller, Get, Post, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  listActive() {
    return this.tablesService.listActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listAll() {
    return this.tablesService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: { number: number; capacity: number; zone?: string }) {
    return this.tablesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: { number?: number; capacity?: number; zone?: string; isActive?: boolean }) {
    return this.tablesService.updateTable(id, body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; force?: boolean; reason?: string },
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.tablesService.updateStatus(id, body, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
