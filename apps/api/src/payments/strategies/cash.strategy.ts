import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentDetails } from './payment.strategy';
import { paymentTransactions } from '../../drizzle/schema/payments.schema';

@Injectable()
export class CashPaymentStrategy implements PaymentStrategy {
  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    if (!details.cashReceived) {
      throw new HttpException(
        { code: 'CASH_RECEIVED_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (details.cashReceived < details.amount) {
      throw new HttpException(
        {
          code: 'CASH_INSUFFICIENT',
          details: { required: details.amount, received: details.cashReceived },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const changeAmount = details.cashReceived - details.amount;

    const [transaction] = await tx
      .insert(paymentTransactions)
      .values({
        orderId,
        paymentMethod: 'CASH',
        amount: details.amount,
        cashReceived: details.cashReceived,
        changeAmount: changeAmount,
        status: 'COMPLETED',
      })
      .returning();

    return transaction;
  }
}
