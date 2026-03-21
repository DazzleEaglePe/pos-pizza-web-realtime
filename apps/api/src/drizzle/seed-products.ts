import { db } from './db';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function seedProducts() {
  console.log('🌱 Seeding additional products...');
  try {
    // ── Categories ──
    const existingSlugs = (await db.select({ slug: schema.categories.slug }).from(schema.categories)).map(r => r.slug);

    const newCats: { name: string; slug: string; icon: string; displayOrder: number }[] = [];
    if (!existingSlugs.includes('pizzas-especiales')) newCats.push({ name: 'Pizzas Especiales', slug: 'pizzas-especiales', icon: 'Flame', displayOrder: 2 });
    if (!existingSlugs.includes('entradas')) newCats.push({ name: 'Entradas', slug: 'entradas', icon: 'Salad', displayOrder: 3 });
    if (!existingSlugs.includes('postres')) newCats.push({ name: 'Postres', slug: 'postres', icon: 'IceCreamCone', displayOrder: 5 });

    if (newCats.length > 0) {
      await db.insert(schema.categories).values(newCats);
      console.log(`  ✅ ${newCats.length} new categories`);
    }

    // Update Bebidas order
    await db.execute(sql`UPDATE categories SET display_order = 4 WHERE slug = 'bebidas'`);

    // ── Helper function ──
    async function getCategoryId(slug: string) {
      const [row] = await db.select({ id: schema.categories.id }).from(schema.categories).where(sql`slug = ${slug}`);
      return row?.id;
    }

    async function addProduct(catSlug: string, p: { name: string; slug: string; description: string; basePrice: number; imageUrl: string; hasVariants: boolean; displayOrder: number }, variants?: { name: string; price: number; displayOrder: number }[]) {
      const existing = await db.select({ id: schema.products.id }).from(schema.products).where(sql`slug = ${p.slug}`);
      if (existing.length > 0) { console.log(`  ⏭ ${p.name} (exists)`); return; }

      const catId = await getCategoryId(catSlug);
      if (!catId) { console.log(`  ⚠ Category ${catSlug} not found`); return; }

      const [prod] = await db.insert(schema.products).values({
        categoryId: catId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        hasVariants: p.hasVariants,
        imageUrl: p.imageUrl,
        displayOrder: p.displayOrder,
      }).returning();

      if (variants && variants.length > 0) {
        await db.insert(schema.productVariants).values(
          variants.map(v => ({ productId: prod.id, name: v.name, price: v.price, displayOrder: v.displayOrder }))
        );
      }
      console.log(`  ✅ ${p.name}`);
    }

    const PIZZA_SIZES = [
      { name: 'Personal (4 slices)', price: 0, displayOrder: 1 },
      { name: 'Mediana (6 slices)', price: 0, displayOrder: 2 },
      { name: 'Familiar (8 slices)', price: 0, displayOrder: 3 },
    ];

    function pizzaVariants(personal: number, mediana: number, familiar: number) {
      return [
        { ...PIZZA_SIZES[0], price: personal },
        { ...PIZZA_SIZES[1], price: mediana },
        { ...PIZZA_SIZES[2], price: familiar },
      ];
    }

    // ── Pizzas Clásicas ──
    console.log('\n📦 Pizzas Clásicas:');
    await addProduct('pizzas-clasicas', { name: 'Pizza Hawaiana', slug: 'pizza-hawaiana', description: 'Jamón, piña caramelizada y queso mozzarella.', basePrice: 25, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop', displayOrder: 2 }, pizzaVariants(15, 25, 35));
    await addProduct('pizzas-clasicas', { name: 'Pizza Americana', slug: 'pizza-americana', description: 'Pepperoni, salchicha, cebolla y pimiento.', basePrice: 27, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop', displayOrder: 3 }, pizzaVariants(16, 27, 38));
    await addProduct('pizzas-clasicas', { name: 'Pizza Margherita', slug: 'pizza-margherita', description: 'Salsa de tomate San Marzano, mozzarella fresca y albahaca.', basePrice: 24, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop', displayOrder: 4 }, pizzaVariants(14, 24, 34));
    await addProduct('pizzas-clasicas', { name: 'Pizza 4 Quesos', slug: 'pizza-4-quesos', description: 'Mozzarella, parmesano, gorgonzola y provolone.', basePrice: 28, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop', displayOrder: 5 }, pizzaVariants(17, 28, 39));
    await addProduct('pizzas-clasicas', { name: 'Pizza Vegetariana', slug: 'pizza-vegetariana', description: 'Champiñones, aceitunas, pimiento, cebolla y tomate.', basePrice: 24, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&h=400&fit=crop', displayOrder: 6 }, pizzaVariants(14, 24, 34));

    // ── Pizzas Especiales ──
    console.log('\n📦 Pizzas Especiales:');
    await addProduct('pizzas-especiales', { name: 'Pizza BBQ Chicken', slug: 'pizza-bbq-chicken', description: 'Pollo a la parrilla, salsa BBQ, cebolla morada y queso cheddar.', basePrice: 30, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&h=400&fit=crop', displayOrder: 1 }, pizzaVariants(18, 30, 42));
    await addProduct('pizzas-especiales', { name: 'Pizza Napolitana', slug: 'pizza-napolitana', description: 'Anchoas, alcaparras, aceitunas negras y orégano fresco.', basePrice: 29, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=400&fit=crop', displayOrder: 2 }, pizzaVariants(17, 29, 40));
    await addProduct('pizzas-especiales', { name: 'Pizza Funghi e Tartufo', slug: 'pizza-funghi-tartufo', description: 'Mix de hongos, aceite de trufa, mozzarella y rúcula.', basePrice: 32, hasVariants: true, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop', displayOrder: 3 }, pizzaVariants(20, 32, 44));

    // ── Entradas ──
    console.log('\n📦 Entradas:');
    await addProduct('entradas', { name: 'Palitos de Ajo', slug: 'palitos-ajo', description: 'Palitos de pan con mantequilla de ajo y parmesano. 6 unidades.', basePrice: 12, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&h=400&fit=crop', displayOrder: 1 });
    await addProduct('entradas', { name: 'Alitas BBQ', slug: 'alitas-bbq', description: '8 alitas de pollo bañadas en salsa BBQ ahumada.', basePrice: 22, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1608039829572-9479e1a54779?w=600&h=400&fit=crop', displayOrder: 2 });
    await addProduct('entradas', { name: 'Ensalada César', slug: 'ensalada-cesar', description: 'Lechuga romana, crotones, parmesano y aderezo césar.', basePrice: 16, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop', displayOrder: 3 });
    await addProduct('entradas', { name: 'Tequeños de Queso', slug: 'tequenos-queso', description: '10 tequeños rellenos de queso con salsa guacamole.', basePrice: 14, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&h=400&fit=crop', displayOrder: 4 });

    // ── Bebidas ──
    console.log('\n📦 Bebidas:');
    await addProduct('bebidas', { name: 'Inca Kola 500ml', slug: 'inca-kola-500', description: 'La bebida del sabor nacional.', basePrice: 5, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=400&fit=crop', displayOrder: 1 });
    await addProduct('bebidas', { name: 'Coca-Cola 500ml', slug: 'coca-cola-500', description: 'Refresco clásico.', basePrice: 5, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&h=400&fit=crop', displayOrder: 2 });
    await addProduct('bebidas', { name: 'Sprite 500ml', slug: 'sprite-500', description: 'Lima-limón refrescante.', basePrice: 5, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=400&fit=crop', displayOrder: 3 });
    await addProduct('bebidas', { name: 'Agua Mineral 600ml', slug: 'agua-mineral-600', description: 'Agua sin gas.', basePrice: 3, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea55?w=600&h=400&fit=crop', displayOrder: 4 });
    await addProduct('bebidas', { name: 'Limonada Natural', slug: 'limonada-natural', description: 'Limonada fresca hecha al momento. 350ml.', basePrice: 7, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=400&fit=crop', displayOrder: 5 });
    await addProduct('bebidas', { name: 'Chicha Morada', slug: 'chicha-morada', description: 'Bebida peruana de maíz morado. 350ml.', basePrice: 6, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&h=400&fit=crop', displayOrder: 6 });

    // ── Postres ──
    console.log('\n📦 Postres:');
    await addProduct('postres', { name: 'Tiramisú', slug: 'tiramisu', description: 'Clásico postre italiano con café y mascarpone.', basePrice: 14, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop', displayOrder: 1 });
    await addProduct('postres', { name: 'Brownie con Helado', slug: 'brownie-helado', description: 'Brownie tibio de chocolate con helado de vainilla y fudge.', basePrice: 12, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop', displayOrder: 2 });
    await addProduct('postres', { name: 'Cheesecake de Maracuyá', slug: 'cheesecake-maracuya', description: 'Cheesecake cremoso con coulis de maracuyá.', basePrice: 13, hasVariants: false, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop', displayOrder: 3 });

    // ── Update existing pizza pepperoni imageUrl ──
    await db.execute(sql`UPDATE products SET image_url = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop' WHERE slug = 'pizza-pepperoni' AND image_url IS NULL`);

    console.log('\n✅ Seeding completed! ~20 products across 5 categories.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedProducts();
