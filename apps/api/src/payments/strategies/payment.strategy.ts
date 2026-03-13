import { ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../../drizzle/schema';

// Type for our transaction instance
type DbTransaction = PgTransaction<any, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export interface PaymentDetails {
  method: 'CASH' | 'YAPE' | 'PLIN' | 'CARD';
  cashReceived?: number;
  referenceNumber?: string;
  amount: number;
}

export interface PaymentStrategy {
  processPayment(
    tx: DbTransaction,
    orderId: string,
    details: PaymentDetails,
  ): Promise<any>;
}
