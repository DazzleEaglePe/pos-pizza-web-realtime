import { db } from './db';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Roles/Users
    console.log('Seeding Users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        email: 'admin@pospizza.com',
        passwordHash: hashedPassword,
        name: 'Administrador Principal',
        role: 'ADMIN',
      })
      .returning();

    const [cashierUser] = await db
      .insert(schema.users)
      .values({
        email: 'caja@pospizza.com',
        passwordHash: hashedPassword,
        name: 'Cajero 1',
        role: 'CAJERO',
      })
      .returning();

    // 2. Seed Categories
    console.log('Seeding Categories...');
    const [pizzasCategory] = await db
      .insert(schema.categories)
      .values({
        name: 'Pizzas Clásicas',
        slug: 'pizzas-clasicas',
        icon: 'Pizza',
        displayOrder: 1,
      })
      .returning();

    const [drinksCategory] = await db
      .insert(schema.categories)
      .values({
        name: 'Bebidas',
        slug: 'bebidas',
        icon: 'CupSoda',
        displayOrder: 2,
      })
      .returning();

    // 3. Seed Products (Pizzas)
    console.log('Seeding Products...');
    const [pepperoniPizza] = await db
      .insert(schema.products)
      .values({
        categoryId: pizzasCategory.id,
        name: 'Pizza Pepperoni',
        slug: 'pizza-pepperoni',
        description: 'Deliciosa pizza con doble pepperoni y extra queso mozzarella.',
        basePrice: 25.0,
        hasVariants: true,
      })
      .returning();

    // 4. Seed Product Variants (Sizes for the Pizza)
    console.log('Seeding Variants...');
    await db.insert(schema.productVariants).values([
      {
        productId: pepperoniPizza.id,
        name: 'Personal (4 slices)',
        price: 15.0,
        displayOrder: 1,
      },
      {
        productId: pepperoniPizza.id,
        name: 'Mediana (6 slices)',
        price: 25.0,
        displayOrder: 2,
      },
      {
        productId: pepperoniPizza.id,
        name: 'Familiar (8 slices)',
        price: 35.0,
        displayOrder: 3,
      },
    ]);

    // 5. Seed Tables
    console.log('Seeding Tables...');
    await db.insert(schema.tables).values([
      { number: 1, capacity: 4, zone: 'Terraza' },
      { number: 2, capacity: 4, zone: 'Terraza' },
      { number: 3, capacity: 2, zone: 'Salón Principal' },
      { number: 4, capacity: 6, zone: 'Salón Principal' },
      { number: 5, capacity: 8, zone: 'Privado' },
    ]);

    // 6. Seed Business Config
    console.log('Seeding Business Config...');
    await db.insert(schema.businessConfig).values({
      companyName: 'POS Pizza',
      taxRateDefault: 18,
      currency: 'PEN',
      timezone: 'America/Lima',
    });

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
}

seed();
