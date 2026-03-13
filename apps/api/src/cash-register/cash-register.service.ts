import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../drizzle/db';
import { cashRegisters, ticketSequences } from '../drizzle/schema/payments.schema';
import { sql, and, eq } from 'drizzle-orm';

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
        throw new InternalServerErrorException('Failed to generate ticket sequence');
      }

      const formattedNumber = sequence.lastNumber.toString().padStart(4, '0');
      return `${prefix}-${formattedNumber}`;
    });
  }

  /**
   * Retrieves the current open cash register for a user.
   */
  async getActiveRegister(userId: string) {
    const [register] = await db.select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.userId, userId), eq(cashRegisters.status, 'OPEN')))
      .limit(1);
    return register;
  }
}
