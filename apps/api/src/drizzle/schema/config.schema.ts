import { uuid,  boolean,  timestamp,  pgTable, text, integer, real, jsonb    } from "drizzle-orm/pg-core";
import { products } from "./catalog.schema";
import { users } from "./auth.schema";

export const businessConfig = pgTable("business_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  ruc: text("ruc"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  taxRateDefault: real("tax_rate_default").notNull().default(18),
  currency: text("currency").notNull().default("PEN"),
  timezone: text("timezone").notNull().default("America/Lima"),
  ticketHeader: text("ticket_header"),
  ticketFooter: text("ticket_footer"),
  trackingBaseUrl: text("tracking_base_url"),
  trackingExpiryHours: integer("tracking_expiry_hours").notNull().default(2),
  logoUrl: text("logo_url"),
  settings: jsonb("settings"),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const productPrepTimes = pgTable("product_prep_times", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
});

export const printerConfigs = pgTable("printer_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),            // 'CASHIER' | 'KITCHEN'
  connectionType: text("connection_type").notNull(), // 'USB' | 'NETWORK'
  ipAddress: text("ip_address"),
  port: integer("port"),
  paperWidth: integer("paper_width").notNull().default(80),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull().unique(),
  metrics: jsonb("metrics").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id), 
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), 
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});
