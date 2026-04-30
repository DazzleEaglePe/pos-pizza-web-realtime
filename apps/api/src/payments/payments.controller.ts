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
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('transactions')
  @Roles('ADMIN', 'CAJERO')
  async listTransactions(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return await this.paymentsService.listTransactions({
      from,
      to,
      method,
      status,
      page,
      limit,
    });
  }

  @Get('transactions/:id')
  @Roles('ADMIN', 'CAJERO')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  @Roles('ADMIN', 'CAJERO')
  async findByOrder(@Param('orderId', new ParseUUIDPipe()) orderId: string) {
    return await this.paymentsService.findByOrder(orderId);
  }

  @Post('transactions/:id/refund')
  @Roles('ADMIN')
  async refund(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { reason: string },
  ) {
    return await this.paymentsService.refund(id, body.reason);
  }
}
