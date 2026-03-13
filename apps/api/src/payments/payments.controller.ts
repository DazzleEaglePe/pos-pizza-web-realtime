import { Controller, Get, UseGuards } from '@nestjs/common';
import { db } from '../drizzle/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  async listTransactions() {
    return await db.query.paymentTransactions.findMany({
      with: {
        order: {
          with: {
            table: true,
          },
        },
      },
      orderBy: (paymentTransactions, { desc }) => [
        desc(paymentTransactions.createdAt),
      ],
    });
  }
}
