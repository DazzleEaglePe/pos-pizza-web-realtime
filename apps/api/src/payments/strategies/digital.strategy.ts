import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentDetails } from './payment.strategy';
import { paymentTransactions } from '../../drizzle/schema/payments.schema';

@Injectable()
export class DigitalPaymentStrategy implements PaymentStrategy {
  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    if (!details.referenceNumber) {
      throw new BadRequestException(`Número de referencia requerido para pagos con ${details.method}`);
    }

    const [transaction] = await tx.insert(paymentTransactions).values({
      orderId,
      paymentMethod: details.method,
      amount: details.amount,
      referenceNumber: details.referenceNumber,
      status: 'COMPLETED',
      cashReceived: null,
      changeAmount: 0,
    }).returning();

    return transaction;
  }
}
