import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentDetails } from './payment.strategy';
import { paymentTransactions } from '../../drizzle/schema/payments.schema';

@Injectable()
export class DigitalPaymentStrategy implements PaymentStrategy {
  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    if (!details.referenceNumber) {
      throw new HttpException(
        { code: 'REFERENCE_REQUIRED', details: { method: details.method } },
        HttpStatus.BAD_REQUEST,
      );
    }

    const [transaction] = await tx
      .insert(paymentTransactions)
      .values({
        orderId,
        paymentMethod: details.method,
        amount: details.amount,
        referenceNumber: details.referenceNumber,
        status: 'COMPLETED',
        cashReceived: null,
        changeAmount: 0,
      })
      .returning();

    return transaction;
  }
}
