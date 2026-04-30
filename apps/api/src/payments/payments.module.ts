import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CashPaymentStrategy } from './strategies/cash.strategy';
import { DigitalPaymentStrategy } from './strategies/digital.strategy';
import { MixedPaymentStrategy } from './strategies/mixed.strategy';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, CashPaymentStrategy, DigitalPaymentStrategy, MixedPaymentStrategy],
  exports: [PaymentsService],
})
export class PaymentsModule {}
