/**
 * Validates and applies promotion pricing to order items.
 *
 * - Checks the promotion is active and within its date window
 * - Overwrites the item price with promoPrice (never trust frontend)
 * - Returns a snapshot for audit purposes
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../drizzle/db';
import { promotions } from '../drizzle/schema/promotions.schema';
import { eq } from 'drizzle-orm';

export interface PromotionSnapshot {
  promotionId: string;
  promotionName: string;
  promoPrice: number;
}

/**
 * For each item that has a promotionId, validate the promo and
 * overwrite the price with promoPrice from the database.
 *
 * Returns an array of snapshots for the promotions used.
 */
export async function validateAndApplyPromotions(
  items: any[],
): Promise<PromotionSnapshot[]> {
  // Collect unique promotion IDs
  const promoIds = [
    ...new Set(
      items
        .filter((i) => i.promotionId)
        .map((i) => i.promotionId as string),
    ),
  ];

  if (promoIds.length === 0) return [];

  const now = new Date();
  const snapshots: PromotionSnapshot[] = [];

  for (const promoId of promoIds) {
    const promo = await db.query.promotions.findFirst({
      where: eq(promotions.id, promoId),
    });

    if (!promo) {
      throw new HttpException(
        { code: 'PROMOTION_NOT_FOUND', details: { promotionId: promoId } },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!promo.isActive) {
      throw new HttpException(
        { code: 'PROMOTION_INACTIVE', details: { promotionId: promoId, name: promo.name } },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (promo.startDate && promo.startDate > now) {
      throw new HttpException(
        { code: 'PROMOTION_NOT_STARTED', details: { promotionId: promoId, startsAt: promo.startDate } },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (promo.endDate && promo.endDate < now) {
      throw new HttpException(
        { code: 'PROMOTION_EXPIRED', details: { promotionId: promoId, endedAt: promo.endDate } },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Overwrite price on all items using this promotion
    for (const item of items) {
      if (item.promotionId === promoId) {
        item.price = Number(promo.promoPrice);
      }
    }

    snapshots.push({
      promotionId: promoId,
      promotionName: promo.name,
      promoPrice: Number(promo.promoPrice),
    });
  }

  return snapshots;
}
