import { Inject, Injectable } from '@nestjs/common';
import { sql, eq, and, gte, lte, count, sum, avg, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';

@Injectable()
export class ReportsService {
  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  /* ─── Sales Today (CAJERO + ADMIN) ───────────────────────── */
  async salesToday() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return this.salesSummary(todayStart, todayEnd);
  }

  /* ─── Sales by Date Range (ADMIN) ────────────────────────── */
  async salesByRange(from: Date, to: Date) {
    const summary = await this.salesSummary(from, to);

    // Daily breakdown
    const daily = await this.db
      .select({
        date: sql<string>`DATE(${schema.orders.createdAt})`.as('date'),
        totalSales: sum(schema.orders.total).as('total_sales'),
        totalOrders: count(schema.orders.id).as('total_orders'),
        avgTicket: avg(schema.orders.total).as('avg_ticket'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
        ),
      )
      .groupBy(sql`DATE(${schema.orders.createdAt})`)
      .orderBy(sql`DATE(${schema.orders.createdAt})`);

    return { ...summary, daily };
  }

  /* ─── Sales by Category (ADMIN) ──────────────────────────── */
  async salesByCategory(from: Date, to: Date) {
    const rows = await this.db
      .select({
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        totalSales: sum(schema.orderItems.subtotal).as('total_sales'),
        totalQty: sum(schema.orderItems.quantity).as('total_qty'),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
        ),
      )
      .groupBy(schema.products.categoryId, schema.categories.name)
      .orderBy(desc(sql`total_sales`));

    return rows;
  }

  /* ─── Sales by Payment Method (ADMIN) ────────────────────── */
  async salesByPaymentMethod(from: Date, to: Date) {
    const rows = await this.db
      .select({
        paymentMethod: schema.paymentTransactions.paymentMethod,
        totalAmount: sum(schema.paymentTransactions.amount).as('total_amount'),
        totalOrders: count(schema.paymentTransactions.id).as('total_orders'),
      })
      .from(schema.paymentTransactions)
      .innerJoin(schema.orders, eq(schema.paymentTransactions.orderId, schema.orders.id))
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
          eq(schema.paymentTransactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(schema.paymentTransactions.paymentMethod);

    return rows;
  }

  /* ─── Sales by Order Type (ADMIN) ────────────────────────── */
  async salesByType(from: Date, to: Date) {
    const rows = await this.db
      .select({
        orderType: schema.orders.orderType,
        totalSales: sum(schema.orders.total).as('total_sales'),
        totalOrders: count(schema.orders.id).as('total_orders'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
        ),
      )
      .groupBy(schema.orders.orderType);

    return rows;
  }

  /* ─── Top Products (ADMIN) ───────────────────────────────── */
  async topProducts(from: Date, to: Date, limit: number) {
    const rows = await this.db
      .select({
        productId: schema.orderItems.productId,
        productName: schema.orderItems.productName,
        totalQty: sum(schema.orderItems.quantity).as('total_qty'),
        totalRevenue: sum(schema.orderItems.subtotal).as('total_revenue'),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
          sql`${schema.orderItems.productId} IS NOT NULL`,
        ),
      )
      .groupBy(schema.orderItems.productId, schema.orderItems.productName)
      .orderBy(desc(sql`total_qty`))
      .limit(limit);

    return rows;
  }

  /* ─── Cancellations (ADMIN) ──────────────────────────────── */
  async cancellations(from: Date, to: Date) {
    const rows = await this.db
      .select({
        id: schema.orders.id,
        ticketNumber: schema.orders.ticketNumber,
        orderType: schema.orders.orderType,
        total: schema.orders.total,
        cancellationReason: schema.orders.cancellationReason,
        cancelledByName: schema.users.name,
        createdAt: schema.orders.createdAt,
        updatedAt: schema.orders.updatedAt,
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.cancelledBy, schema.users.id))
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          eq(schema.orders.status, 'CANCELLED'),
        ),
      )
      .orderBy(desc(schema.orders.updatedAt));

    return rows;
  }

  /* ─── Private: Build sales summary ───────────────────────── */
  private async salesSummary(from: Date, to: Date) {
    const [result] = await this.db
      .select({
        totalSales: sum(schema.orders.total).as('total_sales'),
        totalOrders: count(schema.orders.id).as('total_orders'),
        avgTicket: avg(schema.orders.total).as('avg_ticket'),
        totalTax: sum(schema.orders.taxAmount).as('total_tax'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
        ),
      );

    // Payment method breakdown
    const paymentBreakdown = await this.db
      .select({
        paymentMethod: schema.paymentTransactions.paymentMethod,
        total: sum(schema.paymentTransactions.amount).as('total'),
        count: count(schema.paymentTransactions.id).as('count'),
      })
      .from(schema.paymentTransactions)
      .innerJoin(schema.orders, eq(schema.paymentTransactions.orderId, schema.orders.id))
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          sql`${schema.orders.status} != 'CANCELLED'`,
          eq(schema.paymentTransactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(schema.paymentTransactions.paymentMethod);

    // Cancellation count
    const [cancelledResult] = await this.db
      .select({ count: count(schema.orders.id).as('count') })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, from),
          lte(schema.orders.createdAt, to),
          eq(schema.orders.status, 'CANCELLED'),
        ),
      );

    return {
      totalSales: Number(result.totalSales || 0),
      totalOrders: Number(result.totalOrders || 0),
      avgTicket: Number(Number(result.avgTicket || 0).toFixed(2)),
      totalTax: Number(result.totalTax || 0),
      totalCancelled: cancelledResult.count,
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.paymentMethod,
        total: Number(p.total || 0),
        count: Number(p.count || 0),
      })),
    };
  }
}
