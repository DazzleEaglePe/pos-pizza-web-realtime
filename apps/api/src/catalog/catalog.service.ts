import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { categories, products, productVariants } from '../drizzle/schema/catalog.schema';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class CatalogService {
  async findAll() {
    // 1. Fetch active entities
    const allCategories = await db.select().from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder));
      
    const allProducts = await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.displayOrder));
      
    const allVariants = await db.select().from(productVariants)
      .where(eq(productVariants.isActive, true))
      .orderBy(asc(productVariants.displayOrder));

    // 2. Map and nest the data for the frontend POS
    const menu = allCategories.map(category => ({
      ...category,
      products: allProducts
        .filter(p => p.categoryId === category.id)
        .map(p => ({
          ...p,
          variants: allVariants.filter(v => v.productId === p.id)
        }))
    }));

    return menu;
  }

  async findOne(id: string) {
    const productList = await db.select().from(products).where(eq(products.id, id));
    return productList[0] || null;
  }
}

