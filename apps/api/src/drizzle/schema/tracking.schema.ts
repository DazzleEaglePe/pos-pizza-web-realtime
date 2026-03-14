import { uuid,  timestamp,  pgTable, text, integer   } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders.schema";

export const orderTracking = pgTable("order_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  trackingCode: text("tracking_code").notNull().unique(), 
  qrData: text("qr_data").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const orderTrackingRelations = relations(orderTracking, ({ one }) => ({
  order: one(orders, {
    fields: [orderTracking.orderId],
    references: [orders.id],
  }),
}));
