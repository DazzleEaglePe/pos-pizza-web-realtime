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
  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async makeUniqueCategorySlug(name: string, ignoreId?: string) {
    const base = this.slugify(name) || 'categoria';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
      });
      if (!existing || (ignoreId && existing.id === ignoreId)) return slug;
      counter += 1;
      slug = `${base}-${counter}`;
    }
  }

  private async makeUniqueProductSlug(name: string, ignoreId?: string) {
    const base = this.slugify(name) || 'producto';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await db.query.products.findFirst({
        where: eq(products.slug, slug),
      });
      if (!existing || (ignoreId && existing.id === ignoreId)) return slug;
      counter += 1;
      slug = `${base}-${counter}`;
    }
  }

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

  async findAllAdmin() {
    const [allCategories, allProducts, allVariants] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.displayOrder)),
      db.select().from(products).orderBy(asc(products.displayOrder)),
      db.select().from(productVariants).orderBy(asc(productVariants.displayOrder)),
    ]);

    return allCategories.map((category) => ({
      ...category,
      products: allProducts
        .filter((p) => p.categoryId === category.id)
        .map((p) => ({
          ...p,
          variants: allVariants.filter((v) => v.productId === p.id),
        })),
    }));
  }

  async findOne(id: string) {
    const productList = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return productList[0] || null;
  }

  async createCategory(body: {
    name: string;
    icon?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    const slug = await this.makeUniqueCategorySlug(body.name);
    const [created] = await db
      .insert(categories)
      .values({
        name: body.name,
        slug,
        icon: body.icon ?? null,
        description: body.description ?? null,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateCategory(
    id: string,
    body: {
      name?: string;
      icon?: string | null;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const current = await db.query.categories.findFirst({ where: eq(categories.id, id) });
    if (!current) return null;

    const nextName = body.name ?? current.name;
    const nextSlug = await this.makeUniqueCategorySlug(nextName, id);

    const [updated] = await db
      .update(categories)
      .set({
        name: nextName,
        slug: nextSlug,
        icon: body.icon ?? current.icon,
        description: body.description ?? current.description,
        displayOrder: body.displayOrder ?? current.displayOrder,
        isActive: body.isActive ?? current.isActive,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: string) {
    const [updated] = await db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async createProduct(body: {
    categoryId: string;
    name: string;
    description?: string | null;
    basePrice: number;
    imageUrl?: string | null;
    hasVariants?: boolean;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    const slug = await this.makeUniqueProductSlug(body.name);
    const [created] = await db
      .insert(products)
      .values({
        categoryId: body.categoryId,
        name: body.name,
        slug,
        description: body.description ?? null,
        basePrice: Number(body.basePrice || 0),
        imageUrl: body.imageUrl ?? null,
        hasVariants: body.hasVariants ?? false,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateProduct(
    id: string,
    body: {
      categoryId?: string;
      name?: string;
      description?: string | null;
      basePrice?: number;
      imageUrl?: string | null;
      hasVariants?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const current = await db.query.products.findFirst({ where: eq(products.id, id) });
    if (!current) return null;

    const nextName = body.name ?? current.name;
    const nextSlug = await this.makeUniqueProductSlug(nextName, id);

    const [updated] = await db
      .update(products)
      .set({
        categoryId: body.categoryId ?? current.categoryId,
        name: nextName,
        slug: nextSlug,
        description: body.description ?? current.description,
        basePrice:
          body.basePrice !== undefined
            ? Number(body.basePrice)
            : current.basePrice,
        imageUrl: body.imageUrl ?? current.imageUrl,
        hasVariants: body.hasVariants ?? current.hasVariants,
        displayOrder: body.displayOrder ?? current.displayOrder,
        isActive: body.isActive ?? current.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async deleteProduct(id: string) {
    const [updated] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    await db
      .update(productVariants)
      .set({ isActive: false })
      .where(eq(productVariants.productId, id));

    return updated;
  }

  async createVariant(
    productId: string,
    body: {
      name: string;
      price: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const [created] = await db
      .insert(productVariants)
      .values({
        productId,
        name: body.name,
        price: Number(body.price || 0),
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    await db
      .update(products)
      .set({ hasVariants: true, updatedAt: new Date() })
      .where(eq(products.id, productId));

    return created;
  }

  async updateVariant(
    id: string,
    body: {
      name?: string;
      price?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const current = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, id),
    });
    if (!current) return null;

    const [updated] = await db
      .update(productVariants)
      .set({
        name: body.name ?? current.name,
        price: body.price !== undefined ? Number(body.price) : current.price,
        displayOrder: body.displayOrder ?? current.displayOrder,
        isActive: body.isActive ?? current.isActive,
      })
      .where(eq(productVariants.id, id))
      .returning();

    return updated;
  }

  async deleteVariant(id: string) {
    const [updated] = await db
      .update(productVariants)
      .set({ isActive: false })
      .where(eq(productVariants.id, id))
      .returning();

    return updated;
  }
}
