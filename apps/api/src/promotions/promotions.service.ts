import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../drizzle/db';
import { promotions, promotionItems } from '../drizzle/schema/promotions.schema';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class PromotionsService {
  async findActive() {
    const now = new Date();
    const rows = await db.query.promotions.findMany({
      where: eq(promotions.isActive, true),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: asc(promotions.displayOrder),
    });
    // Also filter by date window in JS — avoids Drizzle SQL helper version conflict
    return rows.filter((p) => {
      if (p.startDate && p.startDate > now) return false;
      if (p.endDate && p.endDate < now) return false;
      return true;
    });
  }

  async findAll() {
    return db.query.promotions.findMany({
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: asc(promotions.displayOrder),
    });
  }

  async findOne(id: string) {
    const promo = await db.query.promotions.findFirst({
      where: eq(promotions.id, id),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
    });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async create(dto: {
    name: string;
    description?: string;
    promoPrice: number;
    originalPrice?: number;
    imageUrl?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    displayOrder?: number;
  }) {
    const [promo] = await db
      .insert(promotions)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        promoPrice: dto.promoPrice,
        originalPrice: dto.originalPrice ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        displayOrder: dto.displayOrder ?? 0,
      })
      .returning();
    return promo;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      promoPrice?: number;
      originalPrice?: number;
      imageUrl?: string;
      isActive?: boolean;
      startDate?: string | null;
      endDate?: string | null;
      displayOrder?: number;
    },
  ) {
    const [updated] = await db
      .update(promotions)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.promoPrice !== undefined && { promoPrice: dto.promoPrice }),
        ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Promotion not found');
    return updated;
  }

  async toggle(id: string) {
    const promo = await db.query.promotions.findFirst({
      where: eq(promotions.id, id),
    });
    if (!promo) throw new NotFoundException('Promotion not found');
    const [updated] = await db
      .update(promotions)
      .set({ isActive: !promo.isActive, updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await db.delete(promotions).where(eq(promotions.id, id));
    return { success: true };
  }

  async addItem(
    promotionId: string,
    dto: {
      productId: string;
      variantId?: string;
      quantity?: number;
      isRequired?: boolean;
    },
  ) {
    await this.findOne(promotionId);
    const [item] = await db
      .insert(promotionItems)
      .values({
        promotionId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity ?? 1,
        isRequired: dto.isRequired ?? true,
      })
      .returning();
    return item;
  }

  async removeItem(promotionId: string, itemId: string) {
    await db
      .delete(promotionItems)
      .where(eq(promotionItems.id, itemId));
    return { success: true };
  }
}
