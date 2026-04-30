import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  inventoryItems,
  productIngredients,
  inventoryMovements,
} from '../drizzle/schema/inventory.schema';
import { eq, and, lt, sql, desc, asc } from 'drizzle-orm';

@Injectable()
export class InventoryService {
  // ─── INSUMOS (Inventory Items) ──────────────────────────

  async createItem(dto: {
    name: string;
    sku?: string;
    unitOfMeasure: string;
    currentStock?: number;
    minStockAlert?: number;
    costPerUnit?: number;
    supplier?: string;
  }) {
    const [item] = await db
      .insert(inventoryItems)
      .values({
        name: dto.name,
        sku: dto.sku || null,
        unitOfMeasure: dto.unitOfMeasure,
        currentStock: dto.currentStock ?? 0,
        minStockAlert: dto.minStockAlert ?? 0,
        costPerUnit: dto.costPerUnit ?? 0,
        supplier: dto.supplier || null,
      })
      .returning();
    return item;
  }

  async updateItem(
    id: string,
    dto: Partial<{
      name: string;
      sku: string;
      unitOfMeasure: string;
      minStockAlert: number;
      costPerUnit: number;
      supplier: string;
      isActive: boolean;
    }>,
  ) {
    const [updated] = await db
      .update(inventoryItems)
      .set({ ...dto, lastUpdated: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    if (!updated)
      throw new HttpException(
        { code: 'ITEM_NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    return updated;
  }

  async findAllItems(lowStockOnly = false) {
    if (lowStockOnly) {
      return db
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.isActive, true),
            lt(inventoryItems.currentStock, inventoryItems.minStockAlert),
          ),
        )
        .orderBy(asc(inventoryItems.name));
    }
    return db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.isActive, true))
      .orderBy(asc(inventoryItems.name));
  }

  async findOneItem(id: string) {
    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, id),
      with: { ingredients: true, movements: true },
    });
    if (!item)
      throw new HttpException(
        { code: 'ITEM_NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    return item;
  }

  async deleteItem(id: string) {
    return this.updateItem(id, { isActive: false });
  }

  // ─── ALERTAS ────────────────────────────────────────────

  async getLowStockAlerts() {
    const items = await db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.isActive, true),
          lt(inventoryItems.currentStock, inventoryItems.minStockAlert),
        ),
      )
      .orderBy(asc(inventoryItems.currentStock));

    return items.map((item) => ({
      ...item,
      shortage: item.minStockAlert - item.currentStock,
      urgency:
        item.currentStock <= item.minStockAlert * 0.25
          ? 'critical'
          : 'warning',
    }));
  }

  // ─── RECETAS (Recipes) ─────────────────────────────────

  async createRecipe(dto: {
    productId: string;
    variantId?: string;
    ingredients: Array<{
      inventoryItemId: string;
      quantityRequired: number;
    }>;
  }) {
    const rows = dto.ingredients.map((ing) => ({
      productId: dto.productId,
      variantId: dto.variantId || null,
      inventoryItemId: ing.inventoryItemId,
      quantityRequired: ing.quantityRequired,
    }));

    return db.insert(productIngredients).values(rows).returning();
  }

  async getRecipes(productId?: string) {
    const query = db.query.productIngredients.findMany({
      where: productId
        ? eq(productIngredients.productId, productId)
        : undefined,
      with: {
        inventoryItem: true,
        product: true,
        variant: true,
      },
    });
    return query;
  }

  async updateRecipeIngredient(
    id: string,
    dto: { quantityRequired: number },
  ) {
    const [updated] = await db
      .update(productIngredients)
      .set({ quantityRequired: dto.quantityRequired })
      .where(eq(productIngredients.id, id))
      .returning();
    if (!updated)
      throw new HttpException(
        { code: 'RECIPE_NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    return updated;
  }

  async deleteRecipeIngredient(id: string) {
    const [deleted] = await db
      .delete(productIngredients)
      .where(eq(productIngredients.id, id))
      .returning();
    if (!deleted)
      throw new HttpException(
        { code: 'RECIPE_NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    return { success: true };
  }

  // ─── RESTOCK (Entradas de inventario) ──────────────────

  async restock(dto: {
    inventoryItemId: string;
    quantity: number;
    supplier?: string;
    notes?: string;
    userId?: string;
  }) {
    return db.transaction(async (tx) => {
      // Update stock
      const [updated] = await tx
        .update(inventoryItems)
        .set({
          currentStock: sql`${inventoryItems.currentStock} + ${dto.quantity}`,
          supplier: dto.supplier || inventoryItems.supplier,
          lastUpdated: new Date(),
        })
        .where(eq(inventoryItems.id, dto.inventoryItemId))
        .returning();

      if (!updated)
        throw new HttpException(
          { code: 'ITEM_NOT_FOUND' },
          HttpStatus.NOT_FOUND,
        );

      // Record movement
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          inventoryItemId: dto.inventoryItemId,
          movementType: 'IN',
          quantity: dto.quantity,
          stockAfter: updated.currentStock,
          referenceType: 'manual',
          notes: dto.notes || null,
          userId: dto.userId || null,
        })
        .returning();

      return { item: updated, movement };
    });
  }

  // ─── AJUSTE MANUAL ─────────────────────────────────────

  async adjust(dto: {
    inventoryItemId: string;
    quantity: number;
    reason: string;
    notes?: string;
    userId?: string;
  }) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(inventoryItems)
        .set({
          currentStock: sql`${inventoryItems.currentStock} + ${dto.quantity}`,
          lastUpdated: new Date(),
        })
        .where(eq(inventoryItems.id, dto.inventoryItemId))
        .returning();

      if (!updated)
        throw new HttpException(
          { code: 'ITEM_NOT_FOUND' },
          HttpStatus.NOT_FOUND,
        );

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          inventoryItemId: dto.inventoryItemId,
          movementType: 'ADJUSTMENT',
          quantity: dto.quantity,
          stockAfter: updated.currentStock,
          referenceType: 'adjustment',
          notes: `${dto.reason}${dto.notes ? ': ' + dto.notes : ''}`,
          userId: dto.userId || null,
        })
        .returning();

      return { item: updated, movement };
    });
  }

  // ─── MOVIMIENTOS ───────────────────────────────────────

  async getMovements(filters?: {
    inventoryItemId?: string;
    movementType?: string;
    limit?: number;
  }) {
    const conditions = [];
    if (filters?.inventoryItemId)
      conditions.push(
        eq(inventoryMovements.inventoryItemId, filters.inventoryItemId),
      );
    if (filters?.movementType)
      conditions.push(
        eq(inventoryMovements.movementType, filters.movementType),
      );

    const query = db
      .select()
      .from(inventoryMovements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(filters?.limit || 100);

    return query;
  }

  // ─── DESCUENTO POR VENTA (llamado desde OrdersService) ─

  async deductByOrder(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    orderId: string,
    items: Array<{
      productId: string | null;
      variantId?: string | null;
      quantity: number;
    }>,
  ) {
    for (const item of items) {
      if (!item.productId) continue;

      // Find recipe for this product/variant
      const conditions = [eq(productIngredients.productId, item.productId)];
      if (item.variantId) {
        conditions.push(eq(productIngredients.variantId, item.variantId));
      }

      let recipe = await tx
        .select()
        .from(productIngredients)
        .where(and(...conditions));

      // Fallback: if no variant-specific recipe, try product-level recipe
      if (recipe.length === 0 && item.variantId) {
        recipe = await tx
          .select()
          .from(productIngredients)
          .where(
            and(
              eq(productIngredients.productId, item.productId),
              sql`${productIngredients.variantId} IS NULL`,
            ),
          );
      }

      // Deduct each ingredient
      for (const ingredient of recipe) {
        const deduction = ingredient.quantityRequired * item.quantity;
        const [updated] = await tx
          .update(inventoryItems)
          .set({
            currentStock: sql`${inventoryItems.currentStock} - ${deduction}`,
            lastUpdated: new Date(),
          })
          .where(eq(inventoryItems.id, ingredient.inventoryItemId))
          .returning();

        if (updated) {
          await tx.insert(inventoryMovements).values({
            inventoryItemId: ingredient.inventoryItemId,
            movementType: 'OUT',
            quantity: -deduction,
            stockAfter: updated.currentStock,
            referenceType: 'order',
            referenceId: orderId,
            notes: null,
            userId: null,
          });
        }
      }
    }
  }

  // ─── REPOSICIÓN POR CANCELACIÓN ────────────────────────

  async restoreByOrder(
    orderId: string,
    items: Array<{
      productId: string | null;
      variantId?: string | null;
      quantity: number;
    }>,
    userId?: string,
  ) {
    return db.transaction(async (tx) => {
      for (const item of items) {
        if (!item.productId) continue;

        const conditions = [eq(productIngredients.productId, item.productId)];
        if (item.variantId) {
          conditions.push(eq(productIngredients.variantId, item.variantId));
        }

        let recipe = await tx
          .select()
          .from(productIngredients)
          .where(and(...conditions));

        if (recipe.length === 0 && item.variantId) {
          recipe = await tx
            .select()
            .from(productIngredients)
            .where(
              and(
                eq(productIngredients.productId, item.productId),
                sql`${productIngredients.variantId} IS NULL`,
              ),
            );
        }

        for (const ingredient of recipe) {
          const restoration = ingredient.quantityRequired * item.quantity;
          const [updated] = await tx
            .update(inventoryItems)
            .set({
              currentStock: sql`${inventoryItems.currentStock} + ${restoration}`,
              lastUpdated: new Date(),
            })
            .where(eq(inventoryItems.id, ingredient.inventoryItemId))
            .returning();

          if (updated) {
            await tx.insert(inventoryMovements).values({
              inventoryItemId: ingredient.inventoryItemId,
              movementType: 'RETURN',
              quantity: restoration,
              stockAfter: updated.currentStock,
              referenceType: 'cancellation',
              referenceId: orderId,
              notes: 'Restauración por cancelación de orden',
              userId: userId || null,
            });
          }
        }
      }
    });
  }
}
