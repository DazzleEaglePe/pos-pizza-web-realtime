import { relations } from 'drizzle-orm';
import {
  uuid,
  timestamp,
  pgTable,
  text,
  integer,
  real,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { tables } from './tables.schema';
import { cashRegisters } from './payments.schema';
import { products, productVariants, modifiers } from './catalog.schema';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketNumber: text('ticket_number').notNull(),
  orderType: text('order_type').notNull(),
  tableId: uuid('table_id').references(() => tables.id),
  customerName: text('customer_name'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  cashRegisterId: uuid('cash_register_id')
    .notNull()
    .references(() => cashRegisters.id),
  status: text('status').notNull().default('RECEIVED'),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
  total: real('total').notNull(),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  deliveredAt: timestamp('delivered_at'),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  productName: text('product_name').notNull(),
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  modifiersTotal: real('modifiers_total').notNull().default(0),
  subtotal: real('subtotal').notNull(),
  notes: text('notes'),
});

export const orderItemModifiers = pgTable('order_item_modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  modifierId: uuid('modifier_id')
    .notNull()
    .references(() => modifiers.id),
  modifierName: text('modifier_name').notNull(),
  price: real('price').notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  estimatedRemainingMin: integer('estimated_remaining_min'),
  notes: text('notes'),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
    relationName: 'orders_user',
  }),
  cancelledByUser: one(users, {
    fields: [orders.cancelledBy],
    references: [users.id],
    relationName: 'orders_cancelled_by',
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  cashRegister: one(cashRegisters, {
    fields: [orders.cashRegisterId],
    references: [cashRegisters.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  modifiers: many(orderItemModifiers),
}));

export const orderItemModifiersRelations = relations(
  orderItemModifiers,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemModifiers.orderItemId],
      references: [orderItems.id],
    }),
    modifier: one(modifiers, {
      fields: [orderItemModifiers.modifierId],
      references: [modifiers.id],
    }),
  }),
);

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedByUser: one(users, {
      fields: [orderStatusHistory.changedBy],
      references: [users.id],
    }),
  }),
);
