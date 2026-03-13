import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CashPaymentStrategy } from './strategies/cash.strategy';
import { DigitalPaymentStrategy } from './strategies/digital.strategy';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, CashPaymentStrategy, DigitalPaymentStrategy],
  exports: [PaymentsService],
})
export class PaymentsModule {}
