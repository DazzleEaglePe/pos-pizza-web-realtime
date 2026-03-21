import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  categories,
  products,
  productVariants,
  modifierGroups,
  modifiers,
  productModifiers,
} from '../drizzle/schema/catalog.schema';
import { productPrepTimes } from '../drizzle/schema/config.schema';
import { eq, asc, and, count, ilike, inArray } from 'drizzle-orm';

@Injectable()
export class CatalogService {
  private async hydrateProducts<T extends { id: string }>(productRows: T[]) {
    if (productRows.length === 0) return [];

    const productIds = productRows.map((product) => product.id);

    const allVariants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.isActive, true),
          inArray(productVariants.productId, productIds),
        ),
      )
      .orderBy(asc(productVariants.displayOrder));

    const allProductModifiers = await db
      .select()
      .from(productModifiers)
      .where(inArray(productModifiers.productId, productIds));

    const modifierGroupIds = [
      ...new Set(allProductModifiers.map((item) => item.modifierGroupId)),
    ];

    const allModifierGroups = modifierGroupIds.length
      ? await db
          .select()
          .from(modifierGroups)
          .where(
            and(
              eq(modifierGroups.isActive, true),
              inArray(modifierGroups.id, modifierGroupIds),
            ),
          )
          .orderBy(asc(modifierGroups.displayOrder))
      : [];

    const allModifierOptions = modifierGroupIds.length
      ? await db
          .select()
          .from(modifiers)
          .where(
            and(
              eq(modifiers.isActive, true),
              inArray(modifiers.groupId, modifierGroupIds),
            ),
          )
          .orderBy(asc(modifiers.displayOrder))
      : [];

    return productRows.map((product) => ({
      ...product,
      variants: allVariants.filter((variant) => variant.productId === product.id),
      modifierGroups: allProductModifiers
        .filter((productModifier) => productModifier.productId === product.id)
        .map((productModifier) => {
          const group = allModifierGroups.find(
            (item) => item.id === productModifier.modifierGroupId,
          );
          if (!group) return null;
          return {
            ...group,
            modifiers: allModifierOptions.filter(
              (modifier) => modifier.groupId === group.id,
            ),
          };
        })
        .filter((group): group is NonNullable<typeof group> => group !== null),
    }));
  }

  private buildActiveProductsWhere(filters?: {
    categoryId?: string;
    search?: string;
  }) {
    const conditions = [eq(products.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search?.trim()) {
      conditions.push(ilike(products.name, `%${filters.search.trim()}%`));
    }

    return conditions.length === 1 ? conditions[0] : and(...conditions);
  }

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

  async findActiveCategories() {
    const [cats, counts] = await Promise.all([
      db
        .select({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.displayOrder)),
      db
        .select({
          categoryId: products.categoryId,
          count: count(),
        })
        .from(products)
        .where(eq(products.isActive, true))
        .groupBy(products.categoryId),
    ]);

    const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));

    return cats.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.id) ?? 0,
    }));
  }

  async findProductsPage(filters: {
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 30);
    const offset = Math.max(filters.offset ?? 0, 0);
    const where = this.buildActiveProductsWhere(filters);

    const [productRows, totalRows] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(asc(products.displayOrder), asc(products.name))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(products).where(where),
    ]);

    const items = await this.hydrateProducts(productRows);
    const total = Number(totalRows[0]?.total ?? 0);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findAllAdmin() {
    const [
      allCategories,
      allProducts,
      allVariants,
      allModifierGroups,
      allModifierOptions,
      allProductModifiers,
    ] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.displayOrder)),
      db.select().from(products).orderBy(asc(products.displayOrder)),
      db.select().from(productVariants).orderBy(asc(productVariants.displayOrder)),
      db.select().from(modifierGroups).orderBy(asc(modifierGroups.displayOrder)),
      db.select().from(modifiers).orderBy(asc(modifiers.displayOrder)),
      db.select().from(productModifiers),
    ]);

    return allCategories.map((category) => ({
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
  }

  async findModifierGroupsAdmin() {
    const [allGroups, allModifiers] = await Promise.all([
      db.select().from(modifierGroups).orderBy(asc(modifierGroups.displayOrder)),
      db.select().from(modifiers).orderBy(asc(modifiers.displayOrder)),
    ]);

    return allGroups.map((group) => ({
      ...group,
      modifiers: allModifiers.filter((m) => m.groupId === group.id),
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

  async createModifierGroup(body: {
    name: string;
    description?: string | null;
    minSelections?: number;
    maxSelections?: number;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    const [created] = await db
      .insert(modifierGroups)
      .values({
        name: body.name,
        description: body.description ?? null,
        minSelections: body.minSelections ?? 0,
        maxSelections: body.maxSelections ?? 99,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateModifierGroup(
    id: string,
    body: {
      name?: string;
      description?: string | null;
      minSelections?: number;
      maxSelections?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const current = await db.query.modifierGroups.findFirst({
      where: eq(modifierGroups.id, id),
    });
    if (!current) return null;

    const [updated] = await db
      .update(modifierGroups)
      .set({
        name: body.name ?? current.name,
        description: body.description ?? current.description,
        minSelections: body.minSelections ?? current.minSelections,
        maxSelections: body.maxSelections ?? current.maxSelections,
        displayOrder: body.displayOrder ?? current.displayOrder,
        isActive: body.isActive ?? current.isActive,
      })
      .where(eq(modifierGroups.id, id))
      .returning();

    return updated;
  }

  async deleteModifierGroup(id: string) {
    const [updated] = await db
      .update(modifierGroups)
      .set({ isActive: false })
      .where(eq(modifierGroups.id, id))
      .returning();

    await db
      .update(modifiers)
      .set({ isActive: false })
      .where(eq(modifiers.groupId, id));

    return updated;
  }

  async createModifier(
    groupId: string,
    body: {
      name: string;
      price: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const [created] = await db
      .insert(modifiers)
      .values({
        groupId,
        name: body.name,
        price: Number(body.price || 0),
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateModifier(
    id: string,
    body: {
      name?: string;
      price?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    const current = await db.query.modifiers.findFirst({
      where: eq(modifiers.id, id),
    });
    if (!current) return null;

    const [updated] = await db
      .update(modifiers)
      .set({
        name: body.name ?? current.name,
        price: body.price !== undefined ? Number(body.price) : current.price,
        displayOrder: body.displayOrder ?? current.displayOrder,
        isActive: body.isActive ?? current.isActive,
      })
      .where(eq(modifiers.id, id))
      .returning();

    return updated;
  }

  async deleteModifier(id: string) {
    const [updated] = await db
      .update(modifiers)
      .set({ isActive: false })
      .where(eq(modifiers.id, id))
      .returning();

    return updated;
  }

  async assignModifierGroupToProduct(productId: string, modifierGroupId: string) {
    const existing = await db.query.productModifiers.findFirst({
      where: and(
        eq(productModifiers.productId, productId),
        eq(productModifiers.modifierGroupId, modifierGroupId),
      ),
    });

    if (existing) return existing;

    const [created] = await db
      .insert(productModifiers)
      .values({ productId, modifierGroupId })
      .returning();

    return created;
  }

  async removeModifierGroupFromProduct(productId: string, modifierGroupId: string) {
    const [removed] = await db
      .delete(productModifiers)
      .where(
        and(
          eq(productModifiers.productId, productId),
          eq(productModifiers.modifierGroupId, modifierGroupId),
        ),
      )
      .returning();

    return removed ?? null;
  }

  // ─── Prep Times ──────────────────────────────────────────

  async getAllPrepTimes() {
    return await db
      .select({
        id: productPrepTimes.id,
        productId: productPrepTimes.productId,
        estimatedMinutes: productPrepTimes.estimatedMinutes,
        productName: products.name,
      })
      .from(productPrepTimes)
      .innerJoin(products, eq(productPrepTimes.productId, products.id));
  }

  async getPrepTime(productId: string) {
    const [row] = await db
      .select()
      .from(productPrepTimes)
      .where(eq(productPrepTimes.productId, productId))
      .limit(1);
    return row ?? null;
  }

  async upsertPrepTime(productId: string, estimatedMinutes: number) {
    const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');

    const existing = await this.getPrepTime(productId);
    if (existing) {
      const [updated] = await db
        .update(productPrepTimes)
        .set({ estimatedMinutes })
        .where(eq(productPrepTimes.productId, productId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(productPrepTimes)
      .values({ productId, estimatedMinutes })
      .returning();
    return created;
  }

  async deletePrepTime(productId: string) {
    const [deleted] = await db
      .delete(productPrepTimes)
      .where(eq(productPrepTimes.productId, productId))
      .returning();
    return deleted ?? null;
  }
}
