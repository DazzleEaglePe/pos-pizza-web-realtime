import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '../drizzle/db';
import { dailySummaries } from '../drizzle/schema/config.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { orderItems } from '../drizzle/schema/orders.schema';
import { paymentTransactions } from '../drizzle/schema/payments.schema';
import {
  sql,
  eq,
  and,
  gte,
  lte,
  count,
  sum,
  avg,
  desc,
} from 'drizzle-orm';

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);

  /**
   * Runs every day at 23:55 to compute and store the daily summary.
   */
  @Cron('55 23 * * *')
  async computeDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const metrics = await this.buildMetrics(today, endOfDay);

      // Upsert by date
      await db
        .insert(dailySummaries)
        .values({ date: today, metrics })
        .onConflictDoUpdate({
          target: dailySummaries.date,
          set: { metrics, createdAt: new Date() },
        });

      this.logger.log(`Daily summary computed for ${today.toISOString().slice(0, 10)}`);
    } catch (err) {
      this.logger.error('Failed to compute daily summary', err);
    }
  }

  /**
   * Build metrics for a given date range. Also callable from reports for on-demand computation.
   */
  async buildMetrics(from: Date, to: Date) {
    // Order aggregate
    const [orderAgg] = await db
      .select({
        totalOrders: count(orders.id),
        totalSales: sum(orders.total),
        totalTax: sum(orders.taxAmount),
        avgTicket: avg(orders.total),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, from),
          lte(orders.createdAt, to),
          sql`${orders.status} != 'CANCELLED'`,
        ),
      );

    // Cancelled count
    const [cancelledAgg] = await db
      .select({ totalCancelled: count(orders.id) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, from),
          lte(orders.createdAt, to),
          eq(orders.status, 'CANCELLED'),
        ),
      );

    // Payment breakdown
    const paymentRows = await db
      .select({
        method: paymentTransactions.paymentMethod,
        total: sum(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, from),
          lte(orders.createdAt, to),
          sql`${orders.status} != 'CANCELLED'`,
        ),
      )
      .groupBy(paymentTransactions.paymentMethod);

    const totalCash = Number(
      paymentRows.find((r) => r.method === 'CASH')?.total ?? 0,
    );
    const totalDigital = paymentRows
      .filter((r) => r.method !== 'CASH' && r.method !== 'MIXED')
      .reduce((s, r) => s + Number(r.total ?? 0), 0);

    // Order type breakdown
    const typeRows = await db
      .select({
        orderType: orders.orderType,
        cnt: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, from),
          lte(orders.createdAt, to),
          sql`${orders.status} != 'CANCELLED'`,
        ),
      )
      .groupBy(orders.orderType);

    const totalSalon = Number(typeRows.find((r) => r.orderType === 'DINE_IN')?.cnt ?? 0);
    const totalParaLlevar = Number(typeRows.find((r) => r.orderType === 'TAKEAWAY')?.cnt ?? 0);

    // Top product
    const [topProduct] = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        totalQty: sum(orderItems.quantity),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, from),
          lte(orders.createdAt, to),
          sql`${orders.status} != 'CANCELLED'`,
          sql`${orderItems.productId} IS NOT NULL`,
        ),
      )
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(1);

    return {
      totalOrders: Number(orderAgg?.totalOrders ?? 0),
      totalCancelled: Number(cancelledAgg?.totalCancelled ?? 0),
      totalSales: Number(orderAgg?.totalSales ?? 0),
      totalCash,
      totalDigital,
      totalTax: Number(orderAgg?.totalTax ?? 0),
      avgTicket: Number(orderAgg?.avgTicket ?? 0),
      topProductId: topProduct?.productId ?? null,
      topProductName: topProduct?.productName ?? null,
      totalSalon,
      totalParaLlevar,
    };
  }

  /**
   * Get stored daily summaries for a date range.
   */
  async getSummaries(from: string, to: string) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(dailySummaries)
      .where(and(gte(dailySummaries.date, start), lte(dailySummaries.date, end)))
      .orderBy(desc(dailySummaries.date));
  }
}
