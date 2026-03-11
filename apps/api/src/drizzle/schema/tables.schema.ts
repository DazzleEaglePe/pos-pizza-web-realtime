import { uuid,  boolean,  timestamp,  pgTable, text, integer    } from "drizzle-orm/pg-core";

export const tables = pgTable("tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull().default(4),
  zone: text("zone"),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, OCCUPIED, RESERVED
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});
