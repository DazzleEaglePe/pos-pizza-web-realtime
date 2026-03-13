import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentDetails } from './payment.strategy';
import { paymentTransactions } from '../../drizzle/schema/payments.schema';

@Injectable()
export class CashPaymentStrategy implements PaymentStrategy {
  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    if (!details.cashReceived) {
      throw new BadRequestException('Monto recibido en efectivo es requerido');
    }

    if (details.cashReceived < details.amount) {
      throw new BadRequestException('El monto recibido es menor al total a pagar');
    }

    const changeAmount = details.cashReceived - details.amount;

    const [transaction] = await tx.insert(paymentTransactions).values({
      orderId,
      paymentMethod: 'CASH',
      amount: details.amount,
      cashReceived: details.cashReceived,
      changeAmount: changeAmount,
      status: 'COMPLETED',
    }).returning();

    return transaction;
  }
}
