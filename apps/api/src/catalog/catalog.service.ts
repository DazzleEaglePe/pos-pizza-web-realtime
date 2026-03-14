import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  categories,
  products,
  productVariants,
  modifierGroups,
  modifiers,
  productModifiers,
} from '../drizzle/schema/catalog.schema';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class CatalogService {
  async findAll() {
    // 1. Fetch all active entities in parallel
    const [
      allCategories,
      allProducts,
      allVariants,
      allModifierGroups,
      allModifierOptions,
      allProductModifiers,
    ] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.displayOrder)),
      db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(asc(products.displayOrder)),
      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.isActive, true))
        .orderBy(asc(productVariants.displayOrder)),
      db
        .select()
        .from(modifierGroups)
        .where(eq(modifierGroups.isActive, true))
        .orderBy(asc(modifierGroups.displayOrder)),
      db
        .select()
        .from(modifiers)
        .where(eq(modifiers.isActive, true))
        .orderBy(asc(modifiers.displayOrder)),
      db.select().from(productModifiers),
    ]);

    // 2. Map and nest the data for the frontend POS
    const menu = allCategories.map((category) => ({
      ...category,
      products: allProducts
        .filter((p) => p.categoryId === category.id)
        .map((p) => ({
          ...p,
          variants: allVariants.filter((v) => v.productId === p.id),
          modifierGroups: allProductModifiers
            .filter((pm) => pm.productId === p.id)
            .map((pm) => {
              const group = allModifierGroups.find(
                (g) => g.id === pm.modifierGroupId,
              );
              if (!group) return null;
              return {
                ...group,
                modifiers: allModifierOptions.filter(
                  (m) => m.groupId === group.id,
                ),
              };
            })
            .filter((g): g is NonNullable<typeof g> => g !== null),
        })),
    }));

    return menu;
  }

  async findOne(id: string) {
    const productList = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return productList[0] || null;
  }
}
