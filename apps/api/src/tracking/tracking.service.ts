import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../drizzle/db';
import { orderTracking } from '../drizzle/schema/tracking.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { productPrepTimes } from '../drizzle/schema/config.schema';
import { eq, inArray } from 'drizzle-orm';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class TrackingService {
  private readonly trackingBaseUrl =
    process.env.TRACKING_WEB_URL || 'http://localhost:3000';

  /**
   * Generate a short unique tracking code like "TRK-A3B7X9"
   */
  generateTrackingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return `TRK-${code}`;
  }

  /**
   * Calculate estimated minutes for an order based on product_prep_times.
   * Uses the MAX prep time among all items (parallel prep).
   * Falls back to 15 min if no prep times configured.
   */
  async calculateEstimatedMinutes(
    productIds: (string | null)[],
  ): Promise<number> {
    const validIds = productIds.filter((id): id is string => id !== null);
    if (validIds.length === 0) return 15;

    const prepTimes = await db
      .select({ estimatedMinutes: productPrepTimes.estimatedMinutes })
      .from(productPrepTimes)
      .where(inArray(productPrepTimes.productId, validIds));

    if (prepTimes.length === 0) return 15;

    return Math.max(...prepTimes.map((p) => p.estimatedMinutes));
  }

  /**
   * Create a tracking record for an order (called within a Drizzle transaction).
   */
  async createTracking(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    orderId: string,
    ticketNumber: string,
    productIds: (string | null)[],
  ) {
    const trackingCode = this.generateTrackingCode();
    const estimatedMinutes =
      await this.calculateEstimatedMinutes(productIds);

    const trackingUrl = `${this.trackingBaseUrl.replace(/\/$/, '')}/tracking/${encodeURIComponent(ticketNumber)}`;
    const qrData = await QRCode.toDataURL(trackingUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const [record] = await tx
      .insert(orderTracking)
      .values({
        orderId,
        trackingCode,
        qrData,
        estimatedMinutes,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      })
      .returning();

    return {
      trackingCode: record.trackingCode,
      qrData: record.qrData,
      estimatedMinutes: record.estimatedMinutes,
      trackingUrl,
    };
  }

  /**
   * Find order by tracking code (public endpoint).
   */
  async findByCode(code: string) {
    const tracking = await db.query.orderTracking.findFirst({
      where: eq(orderTracking.trackingCode, code.toUpperCase()),
    });

    if (!tracking) {
      throw new HttpException(
        { code: 'TRACKING_NOT_FOUND', details: { code } },
        HttpStatus.NOT_FOUND,
      );
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, tracking.orderId),
      with: {
        items: true,
        statusHistory: true,
        table: true,
      },
    });

    if (!order) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { trackingCode: code } },
        HttpStatus.NOT_FOUND,
      );
    }

    const safeItems = Array.isArray((order as any).items)
      ? (order as any).items
      : [];
    const safeHistory = Array.isArray((order as any).statusHistory)
      ? (order as any).statusHistory
      : [];

    return {
      id: order.id,
      ticketNumber: order.ticketNumber,
      status: order.status,
      orderType: order.orderType,
      customerName: order.customerName,
      table: order.table
        ? { number: order.table.number, zone: order.table.zone }
        : null,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      tracking: {
        code: tracking.trackingCode,
        estimatedMinutes: tracking.estimatedMinutes,
        qrData: tracking.qrData,
      },
      items: safeItems.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        variantName: item.variantName,
      })),
      statusHistory: safeHistory
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .map((h: any) => ({
          status: h.status,
          createdAt: h.createdAt,
        })),
    };
  }

  /**
   * Get tracking info for an order by orderId.
   */
  async findByOrderId(orderId: string) {
    return await db.query.orderTracking.findFirst({
      where: eq(orderTracking.orderId, orderId),
    });
  }
}
