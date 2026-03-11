import { uuid,  boolean,  timestamp,  pgTable, text, integer, real    } from "drizzle-orm/pg-core";
import { products, productVariants } from "./catalog.schema";

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").unique(),
  unitOfMeasure: text("unit_of_measure").notNull(), 
  currentStock: real("current_stock").notNull().default(0),
  minStockAlert: real("min_stock_alert").notNull().default(0),
  costPerUnit: real("cost_per_unit").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").notNull().$defaultFn(() => new Date()),
});

export const productIngredients = pgTable("product_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id), 
  quantityRequired: real("quantity_required").notNull(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
  movementType: text("movement_type").notNull(), 
  quantity: real("quantity").notNull(),
  referenceId: uuid("reference_id"), 
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});
