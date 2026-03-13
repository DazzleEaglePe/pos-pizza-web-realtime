import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';

@Module({
  imports: [NotificationsModule, PaymentsModule, CashRegisterModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
