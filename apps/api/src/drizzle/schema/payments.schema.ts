import { uuid,  timestamp,  pgTable, text, integer, real   } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { orders } from "./orders.schema";

export const cashRegisters = pgTable("cash_registers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  openedAt: timestamp("opened_at").notNull().$defaultFn(() => new Date()),
  closedAt: timestamp("closed_at"),
  openingAmount: real("opening_amount").notNull(),
  expectedCash: real("expected_cash"),
  actualCash: real("actual_cash"),
  difference: real("difference"),
  totalSales: real("total_sales"),
  totalCashSales: real("total_cash_sales"),
  totalDigitalSales: real("total_digital_sales"),
  totalTickets: integer("total_tickets"),
  totalCancelled: integer("total_cancelled").default(0),
  notes: text("notes"),
  status: text("status").notNull().default("OPEN"), 
});

export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id),
  paymentMethod: text("payment_method").notNull(), 
  amount: real("amount").notNull(),
  cashReceived: real("cash_received"),
  changeAmount: real("change_amount"),
  referenceNumber: text("reference_number"),
  status: text("status").notNull().default("COMPLETED"), 
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const ticketSequences = pgTable("ticket_sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull().unique(),
  lastNumber: integer("last_number").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});
