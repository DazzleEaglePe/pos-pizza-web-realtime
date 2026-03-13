import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  cashRegisters,
  ticketSequences,
  paymentTransactions,
} from '../drizzle/schema/payments.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { sql, and, eq, sum, count } from 'drizzle-orm';

@Injectable()
export class CashRegisterService {
  /**
   * Generates the next sequential ticket number for the current day.
   * Uses Drizzle transaction to safely increment the counter.
   */
  async generateNextTicketNumber(): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const prefix = `TKT-${year}${month}${day}`;

    return await db.transaction(async (tx) => {
      // Upsert the sequence for today
      const [sequence] = await tx
        .insert(ticketSequences)
        .values({
          date: today,
          lastNumber: 1,
        })
        .onConflictDoUpdate({
          target: ticketSequences.date,
          set: {
            lastNumber: sql`${ticketSequences.lastNumber} + 1`,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!sequence) {
        throw new InternalServerErrorException(
          'Failed to generate ticket sequence',
        );
      }

      const formattedNumber = sequence.lastNumber.toString().padStart(4, '0');
      return `${prefix}-${formattedNumber}`;
    });
  }

  /**
   * Retrieves the current open cash register for a user.
   */
  async getActiveRegister(userId: string) {
    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(
        and(eq(cashRegisters.userId, userId), eq(cashRegisters.status, 'OPEN')),
      )
      .limit(1);
    return register;
  }

  async openRegister(userId: string, openingAmount: number) {
    const existing = await this.getActiveRegister(userId);
    if (existing) {
      throw new HttpException(
        { code: 'REGISTER_ALREADY_OPEN' },
        HttpStatus.CONFLICT,
      );
    }

    const [register] = await db
      .insert(cashRegisters)
      .values({
        userId,
        openingAmount,
        status: 'OPEN',
      })
      .returning();

    return register;
  }

  /**
   * Computes live sales breakdown for a given register (without closing it).
   */
  private async computeSalesData(registerId: string) {
    const salesData = await db
      .select({
        totalSales: sum(paymentTransactions.amount),
        totalCash: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.paymentMethod} = 'CASH' THEN ${paymentTransactions.amount} ELSE 0 END), 0)`,
        totalDigital: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.paymentMethod} != 'CASH' THEN ${paymentTransactions.amount} ELSE 0 END), 0)`,
        totalTickets: count(paymentTransactions.id),
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(eq(orders.cashRegisterId, registerId));

    const row = salesData[0];
    return {
      totalSales: Number(row?.totalSales ?? 0),
      totalCashSales: Number(row?.totalCash ?? 0),
      totalDigitalSales: Number(row?.totalDigital ?? 0),
      totalTickets: Number(row?.totalTickets ?? 0),
    };
  }

  /**
   * Returns the active register plus a live sales summary.
   */
  async getSummary(userId: string) {
    const register = await this.getActiveRegister(userId);
    if (!register) return null;

    const sales = await this.computeSalesData(register.id);
    const expectedCash = register.openingAmount + sales.totalCashSales;

    return {
      ...register,
      ...sales,
      expectedCash,
    };
  }

  async closeRegister(userId: string, actualCash: number, notes?: string) {
    const register = await this.getActiveRegister(userId);
    if (!register) {
      throw new HttpException(
        { code: 'NO_OPEN_REGISTER' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { totalSales, totalCashSales, totalDigitalSales, totalTickets } =
      await this.computeSalesData(register.id);
    const expectedCash = register.openingAmount + totalCashSales;
    const difference = actualCash - expectedCash;

    const [closed] = await db
      .update(cashRegisters)
      .set({
        status: 'CLOSED',
        closedAt: new Date(),
        actualCash,
        expectedCash,
        difference,
        totalSales,
        totalCashSales,
        totalDigitalSales,
        totalTickets,
        notes: notes || null,
      })
      .where(eq(cashRegisters.id, register.id))
      .returning();

    return closed;
  }
}
