import { Injectable, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException(`Método de pago no soportado: ${details.method}`);
    }

    return await strategy.processPayment(tx, orderId, details);
  }
}
