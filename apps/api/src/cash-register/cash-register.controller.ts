import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

type AuthUser = { id: string; role: string; email: string };

@Controller('cash-register')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get('current')
  @Roles('ADMIN', 'CAJERO')
  async getCurrent(@CurrentUser() user: AuthUser) {
    const register = await this.cashRegisterService.getActiveRegister(user.id);
    return { register: register || null };
  }

  @Get('summary')
  @Roles('ADMIN', 'CAJERO')
  async getSummary(@CurrentUser() user: AuthUser) {
    const summary = await this.cashRegisterService.getSummary(user.id);
    return { summary: summary || null };
  }

  @Get('history')
  @Roles('ADMIN')
  async getHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return await this.cashRegisterService.findHistory({ from, to, userId, page, limit });
  }

  @Get('history/:id')
  @Roles('ADMIN')
  async getHistoryDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.cashRegisterService.findOneById(id);
  }

  @Post('open')
  @Roles('ADMIN', 'CAJERO')
  async open(
    @CurrentUser() user: AuthUser,
    @Body() body: { openingAmount: number },
  ) {
    const register = await this.cashRegisterService.openRegister(
      user.id,
      Number(body.openingAmount),
    );
    return { register };
  }

  @Post('close')
  @Roles('ADMIN', 'CAJERO')
  async close(
    @CurrentUser() user: AuthUser,
    @Body() body: { actualCash: number; notes?: string },
  ) {
    const register = await this.cashRegisterService.closeRegister(
      user.id,
      Number(body.actualCash),
      body.notes,
    );
    return { register };
  }
}
