import { db } from './db';
import { productPrepTimes } from './schema/config.schema';
import { products } from './schema/catalog.schema';

/**
 * Seed product_prep_times for all products that don't have one yet.
 * Run: npx ts-node src/drizzle/seed-prep-times.ts
 */
async function seedPrepTimes() {
  console.log('🕐 Seeding product prep times...');

  const allProducts = await db.select({ id: products.id, name: products.name }).from(products);

  if (allProducts.length === 0) {
    console.log('⚠️  No products found. Run seed first.');
    process.exit(0);
  }

  const existing = await db.select({ productId: productPrepTimes.productId }).from(productPrepTimes);
  const existingIds = new Set(existing.map((e) => e.productId));

  const toInsert = allProducts
    .filter((p) => !existingIds.has(p.id))
    .map((p) => {
      const name = p.name.toLowerCase();
      let minutes = 15; // default

      if (name.includes('pizza')) minutes = 18;
      else if (name.includes('bebida') || name.includes('gaseosa') || name.includes('agua') || name.includes('jugo')) minutes = 2;
      else if (name.includes('extra') || name.includes('porcion') || name.includes('complemento')) minutes = 5;
      else if (name.includes('ensalada') || name.includes('entrada')) minutes = 8;

      return {
        productId: p.id,
        estimatedMinutes: minutes,
      };
    });

  if (toInsert.length === 0) {
    console.log('✅ All products already have prep times.');
    process.exit(0);
  }

  await db.insert(productPrepTimes).values(toInsert);
  console.log(`✅ Inserted ${toInsert.length} prep time records:`);
  for (const item of toInsert) {
    const product = allProducts.find((p) => p.id === item.productId);
    console.log(`   ${product?.name}: ${item.estimatedMinutes} min`);
  }

  process.exit(0);
}

seedPrepTimes().catch((err) => {
  console.error('❌ Error seeding prep times:', err);
  process.exit(1);
});
