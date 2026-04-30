import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentDetails } from './payment.strategy';
import { paymentTransactions } from '../../drizzle/schema/payments.schema';

@Injectable()
export class MixedPaymentStrategy implements PaymentStrategy {
  async processPayment(tx: any, orderId: string, details: PaymentDetails) {
    if (!details.cashAmount || details.cashAmount <= 0) {
      throw new HttpException(
        { code: 'MIXED_CASH_AMOUNT_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!details.digitalAmount || details.digitalAmount <= 0) {
      throw new HttpException(
        { code: 'MIXED_DIGITAL_AMOUNT_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!details.digitalMethod) {
      throw new HttpException(
        { code: 'MIXED_DIGITAL_METHOD_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!details.referenceNumber) {
      throw new HttpException(
        { code: 'REFERENCE_REQUIRED', details: { method: details.digitalMethod } },
        HttpStatus.BAD_REQUEST,
      );
    }

    const sum = details.cashAmount + details.digitalAmount;
    if (Math.abs(sum - details.amount) > 0.01) {
      throw new HttpException(
        {
          code: 'MIXED_AMOUNT_MISMATCH',
          details: { expected: details.amount, cashAmount: details.cashAmount, digitalAmount: details.digitalAmount },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!details.cashReceived || details.cashReceived < details.cashAmount) {
      throw new HttpException(
        {
          code: 'CASH_INSUFFICIENT',
          details: { required: details.cashAmount, received: details.cashReceived },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const changeAmount = details.cashReceived - details.cashAmount;

    const [transaction] = await tx
      .insert(paymentTransactions)
      .values({
        orderId,
        paymentMethod: 'MIXED',
        amount: details.amount,
        cashAmount: details.cashAmount,
        digitalAmount: details.digitalAmount,
        digitalMethod: details.digitalMethod,
        cashReceived: details.cashReceived,
        changeAmount,
        referenceNumber: details.referenceNumber,
        status: 'COMPLETED',
      })
      .returning();

    return transaction;
  }
}
