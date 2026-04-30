import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaymentDetails, PaymentStrategy } from './strategies/payment.strategy';
import { CashPaymentStrategy } from './strategies/cash.strategy';
import { DigitalPaymentStrategy } from './strategies/digital.strategy';
import { MixedPaymentStrategy } from './strategies/mixed.strategy';
import { db } from '../drizzle/db';
import { paymentTransactions } from '../drizzle/schema/payments.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { tables } from '../drizzle/schema/tables.schema';
import { eq, desc, and, gte, lte, count, SQL } from 'drizzle-orm';

@Injectable()
export class PaymentsService {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private cashStrategy: CashPaymentStrategy,
    private digitalStrategy: DigitalPaymentStrategy,
    private mixedStrategy: MixedPaymentStrategy,
  ) {
    this.strategies.set('CASH', this.cashStrategy);
    this.strategies.set('YAPE', this.digitalStrategy);
    this.strategies.set('PLIN', this.digitalStrategy);
    this.strategies.set('CARD', this.digitalStrategy);
    this.strategies.set('MIXED', this.mixedStrategy);
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

  async listTransactions(filters: {
    from?: string;
    to?: string;
    method?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (filters.method) conditions.push(eq(paymentTransactions.paymentMethod, filters.method));
    if (filters.status) conditions.push(eq(paymentTransactions.status, filters.status));
    if (filters.from) conditions.push(gte(paymentTransactions.createdAt, new Date(filters.from)));
    if (filters.to) conditions.push(lte(paymentTransactions.createdAt, new Date(filters.to)));

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: paymentTransactions.id,
          orderId: paymentTransactions.orderId,
          paymentMethod: paymentTransactions.paymentMethod,
          amount: paymentTransactions.amount,
          cashReceived: paymentTransactions.cashReceived,
          changeAmount: paymentTransactions.changeAmount,
          cashAmount: paymentTransactions.cashAmount,
          digitalAmount: paymentTransactions.digitalAmount,
          digitalMethod: paymentTransactions.digitalMethod,
          referenceNumber: paymentTransactions.referenceNumber,
          status: paymentTransactions.status,
          refundReason: paymentTransactions.refundReason,
          refundedAt: paymentTransactions.refundedAt,
          createdAt: paymentTransactions.createdAt,
          ticketNumber: orders.ticketNumber,
          orderType: orders.orderType,
        })
        .from(paymentTransactions)
        .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
        .where(where)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(paymentTransactions)
        .where(where),
    ]);

    return { data: rows, total: countResult[0]?.count ?? 0, page, limit };
  }

  async findOne(id: string) {
    return await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.id, id),
      with: { order: { with: { table: true } } },
    });
  }

  async findByOrder(orderId: string) {
    return await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.orderId, orderId),
      with: { order: true },
    });
  }

  async refund(transactionId: string, reason: string) {
    const transaction = await this.findOne(transactionId);
    if (!transaction) {
      throw new HttpException({ code: 'TRANSACTION_NOT_FOUND' }, HttpStatus.NOT_FOUND);
    }
    if (transaction.status === 'REFUNDED') {
      throw new HttpException({ code: 'ALREADY_REFUNDED' }, HttpStatus.CONFLICT);
    }

    const [updated] = await db
      .update(paymentTransactions)
      .set({
        status: 'REFUNDED',
        refundReason: reason,
        refundedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, transactionId))
      .returning();

    return updated;
  }
}
