import { uuid,  boolean,  timestamp,  pgTable, text, integer, real    } from "drizzle-orm/pg-core";
import { products, productVariants } from "./catalog.schema";

export const promotions = pgTable("promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  promoPrice: real("promo_price").notNull(), 
  originalPrice: real("original_price"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const promotionItems = pgTable("promotion_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  promotionId: uuid("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  isRequired: boolean("is_required").notNull().default(true),
});
