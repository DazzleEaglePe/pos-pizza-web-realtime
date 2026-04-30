/**
 * Seed inventory items (insumos) and link recipes to existing products.
 * Run: npx ts-node src/drizzle/seed-inventory.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { inventoryItems, productIngredients } from './schema/inventory.schema';
import { products, productVariants } from './schema/catalog.schema';
import { eq } from 'drizzle-orm';

async function seedInventory() {
  console.log('🌱 Seeding inventory items...');

  // Upsert inventory items
  const items = [
    { name: 'Masa Base', sku: 'INS-001', unitOfMeasure: 'g', currentStock: 10000, minStockAlert: 2000, costPerUnit: 0.005, supplier: 'Harinera del Norte' },
    { name: 'Queso Mozzarella', sku: 'INS-002', unitOfMeasure: 'g', currentStock: 5000, minStockAlert: 1000, costPerUnit: 0.012, supplier: 'Lácteos Premium' },
    { name: 'Salsa de Tomate', sku: 'INS-003', unitOfMeasure: 'ml', currentStock: 8000, minStockAlert: 1500, costPerUnit: 0.003, supplier: 'Salsas Express' },
    { name: 'Pepperoni', sku: 'INS-004', unitOfMeasure: 'g', currentStock: 3000, minStockAlert: 500, costPerUnit: 0.025, supplier: 'Embutidos Select' },
    { name: 'Jamón', sku: 'INS-005', unitOfMeasure: 'g', currentStock: 3000, minStockAlert: 500, costPerUnit: 0.018, supplier: 'Embutidos Select' },
    { name: 'Piña', sku: 'INS-006', unitOfMeasure: 'g', currentStock: 2000, minStockAlert: 400, costPerUnit: 0.008, supplier: 'Frutas Tropicales' },
    { name: 'Champiñones', sku: 'INS-007', unitOfMeasure: 'g', currentStock: 1500, minStockAlert: 300, costPerUnit: 0.015, supplier: 'Verduras Frescas' },
    { name: 'Aceitunas', sku: 'INS-008', unitOfMeasure: 'g', currentStock: 1200, minStockAlert: 250, costPerUnit: 0.02, supplier: 'Importados' },
    { name: 'Cebolla', sku: 'INS-009', unitOfMeasure: 'g', currentStock: 2500, minStockAlert: 500, costPerUnit: 0.004, supplier: 'Verduras Frescas' },
    { name: 'Pimiento', sku: 'INS-010', unitOfMeasure: 'g', currentStock: 2000, minStockAlert: 400, costPerUnit: 0.006, supplier: 'Verduras Frescas' },
    { name: 'Coca-Cola 350ml', sku: 'INS-011', unitOfMeasure: 'unidades', currentStock: 100, minStockAlert: 20, costPerUnit: 0.8, supplier: 'Distribuidora Central' },
    { name: 'Sprite 350ml', sku: 'INS-012', unitOfMeasure: 'unidades', currentStock: 80, minStockAlert: 15, costPerUnit: 0.8, supplier: 'Distribuidora Central' },
    { name: 'Agua Mineral 500ml', sku: 'INS-013', unitOfMeasure: 'unidades', currentStock: 120, minStockAlert: 25, costPerUnit: 0.5, supplier: 'Distribuidora Central' },
  ];

  const insertedItems: Record<string, string> = {};

  for (const item of items) {
    const existing = await db.select().from(inventoryItems).where(eq(inventoryItems.sku, item.sku!));
    if (existing.length > 0) {
      insertedItems[item.name] = existing[0].id;
      console.log(`  ⏩ ${item.name} already exists`);
    } else {
      const [created] = await db.insert(inventoryItems).values(item).returning();
      insertedItems[item.name] = created.id;
      console.log(`  ✅ ${item.name} created (stock: ${item.currentStock} ${item.unitOfMeasure})`);
    }
  }

  // Now link recipes to existing products
  console.log('\n🍕 Linking recipes to products...');

  const allProducts = await db.select().from(products).where(eq(products.isActive, true));
  const allVariants = await db.select().from(productVariants);

  for (const product of allProducts) {
    const name = product.name.toLowerCase();
    const variants = allVariants.filter((v) => v.productId === product.id);

    // Define recipes based on product name heuristics
    let recipeIngredients: Array<{ itemName: string; baseQty: number }> = [];

    if (name.includes('pepperoni')) {
      recipeIngredients = [
        { itemName: 'Masa Base', baseQty: 250 },
        { itemName: 'Queso Mozzarella', baseQty: 150 },
        { itemName: 'Salsa de Tomate', baseQty: 80 },
        { itemName: 'Pepperoni', baseQty: 100 },
      ];
    } else if (name.includes('hawaiana') || name.includes('hawaii')) {
      recipeIngredients = [
        { itemName: 'Masa Base', baseQty: 250 },
        { itemName: 'Queso Mozzarella', baseQty: 150 },
        { itemName: 'Salsa de Tomate', baseQty: 80 },
        { itemName: 'Jamón', baseQty: 80 },
        { itemName: 'Piña', baseQty: 60 },
      ];
    } else if (name.includes('vegetariana') || name.includes('vegetal')) {
      recipeIngredients = [
        { itemName: 'Masa Base', baseQty: 250 },
        { itemName: 'Queso Mozzarella', baseQty: 150 },
        { itemName: 'Salsa de Tomate', baseQty: 80 },
        { itemName: 'Champiñones', baseQty: 50 },
        { itemName: 'Aceitunas', baseQty: 30 },
        { itemName: 'Cebolla', baseQty: 40 },
        { itemName: 'Pimiento', baseQty: 40 },
      ];
    } else if (name.includes('margarita') || name.includes('margherita')) {
      recipeIngredients = [
        { itemName: 'Masa Base', baseQty: 250 },
        { itemName: 'Queso Mozzarella', baseQty: 180 },
        { itemName: 'Salsa de Tomate', baseQty: 100 },
      ];
    } else if (name.includes('coca')) {
      recipeIngredients = [{ itemName: 'Coca-Cola 350ml', baseQty: 1 }];
    } else if (name.includes('sprite')) {
      recipeIngredients = [{ itemName: 'Sprite 350ml', baseQty: 1 }];
    } else if (name.includes('agua')) {
      recipeIngredients = [{ itemName: 'Agua Mineral 500ml', baseQty: 1 }];
    }

    if (recipeIngredients.length === 0) continue;

    // Size multipliers for variants
    const sizeMultiplier = (variantName: string): number => {
      const n = variantName.toLowerCase();
      if (n.includes('personal') || n.includes('small')) return 0.7;
      if (n.includes('mediana') || n.includes('medium')) return 1;
      if (n.includes('familiar') || n.includes('grande') || n.includes('large') || n.includes('family')) return 1.5;
      return 1;
    };

    if (variants.length > 0) {
      // Create variant-specific recipes
      for (const variant of variants) {
        const multiplier = sizeMultiplier(variant.name);
        for (const ri of recipeIngredients) {
          const itemId = insertedItems[ri.itemName];
          if (!itemId) continue;

          const existing = await db.select().from(productIngredients)
            .where(eq(productIngredients.productId, product.id));
          const dupe = existing.find(
            (e) => e.inventoryItemId === itemId && e.variantId === variant.id
          );
          if (dupe) continue;

          await db.insert(productIngredients).values({
            productId: product.id,
            variantId: variant.id,
            inventoryItemId: itemId,
            quantityRequired: Math.round(ri.baseQty * multiplier),
          });
        }
        console.log(`  ✅ ${product.name} [${variant.name}] recipe linked (x${multiplier})`);
      }
    } else {
      // Product without variants
      for (const ri of recipeIngredients) {
        const itemId = insertedItems[ri.itemName];
        if (!itemId) continue;

        const existing = await db.select().from(productIngredients)
          .where(eq(productIngredients.productId, product.id));
        const dupe = existing.find(
          (e) => e.inventoryItemId === itemId && e.variantId === null
        );
        if (dupe) continue;

        await db.insert(productIngredients).values({
          productId: product.id,
          variantId: null,
          inventoryItemId: itemId,
          quantityRequired: ri.baseQty,
        });
      }
      console.log(`  ✅ ${product.name} recipe linked`);
    }
  }

  console.log('\n✅ Inventory seeding complete!');
  process.exit(0);
}

seedInventory().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
