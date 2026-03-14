import { uuid, boolean, timestamp, pgTable, text, real, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products, productVariants } from "./catalog.schema";
import { users } from "./auth.schema";

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").unique(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  minStockAlert: real("min_stock_alert").notNull().default(0),
  costPerUnit: real("cost_per_unit").notNull().default(0),
  supplier: text("supplier"),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").notNull().$defaultFn(() => new Date()),
});

export const productIngredients = pgTable("product_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id),
  quantityRequired: real("quantity_required").notNull(),
}, (t) => [
  unique("unique_recipe").on(t.productId, t.variantId, t.inventoryItemId),
]);

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
  movementType: text("movement_type").notNull(),
  quantity: real("quantity").notNull(),
  stockAfter: real("stock_after").notNull(),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

// ─── RELATIONS ────────────────────────────────────────────
export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  ingredients: many(productIngredients),
  movements: many(inventoryMovements),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  inventoryItem: one(inventoryItems, {
    fields: [productIngredients.inventoryItemId],
    references: [inventoryItems.id],
  }),
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productIngredients.variantId],
    references: [productVariants.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  inventoryItem: one(inventoryItems, {
    fields: [inventoryMovements.inventoryItemId],
    references: [inventoryItems.id],
  }),
  user: one(users, {
    fields: [inventoryMovements.userId],
    references: [users.id],
  }),
}));
