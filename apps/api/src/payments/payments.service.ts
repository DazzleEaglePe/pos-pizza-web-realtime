import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaymentDetails, PaymentStrategy } from './strategies/payment.strategy';
import { CashPaymentStrategy } from './strategies/cash.strategy';
import { DigitalPaymentStrategy } from './strategies/digital.strategy';

@Injectable()
export class PaymentsService {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private cashStrategy: CashPaymentStrategy,
    private digitalStrategy: DigitalPaymentStrategy,
  ) {
    this.strategies.set('CASH', this.cashStrategy);
    this.strategies.set('YAPE', this.digitalStrategy);
    this.strategies.set('PLIN', this.digitalStrategy);
    this.strategies.set('CARD', this.digitalStrategy);
  }

  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    const strategy = this.strategies.get(details.method);

    if (!strategy) {
      throw new HttpException(
        {
          code: 'PAYMENT_METHOD_UNSUPPORTED',
          details: { method: details.method },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return await strategy.processPayment(tx, orderId, details);
  }
}
