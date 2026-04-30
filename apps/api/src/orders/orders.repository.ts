import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../drizzle/db';
import { orders } from '../drizzle/schema/orders.schema';
import { eq } from 'drizzle-orm';
import { TrackingService } from '../tracking/tracking.service';
import { BusinessConfigService } from '../config/config.service';

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly tracking: TrackingService,
    private readonly businessConfig: BusinessConfigService,
  ) {}

  async findAll() {
    return await db.query.orders.findMany({
      with: {
        items: true,
        table: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
  }

  async findActive() {
    return await db.query.orders.findMany({
      where: (orders, { inArray }) =>
        inArray(orders.status, ['RECEIVED', 'PREPARING', 'IN_OVEN', 'READY']),
      with: {
        items: true,
        table: true,
      },
      orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    });
  }

  async findOne(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
      },
    });
    if (!order) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { orderId: id } },
        HttpStatus.NOT_FOUND,
      );
    }

    const trackingRecord = await this.tracking.findByOrderId(id);

    return {
      ...order,
      tracking: trackingRecord
        ? {
            code: trackingRecord.trackingCode,
            qrData: trackingRecord.qrData,
            estimatedMinutes: trackingRecord.estimatedMinutes,
          }
        : null,
    };
  }

  async findByTicketNumber(ticketNumber: string) {
    const [order, config] = await Promise.all([
      db.query.orders.findFirst({
        where: eq(orders.ticketNumber, ticketNumber),
        with: {
          items: true,
          statusHistory: true,
          table: true,
        },
      }),
      this.businessConfig.getConfig(),
    ]);

    if (!order) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { ticketNumber } },
        HttpStatus.NOT_FOUND,
      );
    }

    const trackingRecord = await this.tracking.findByOrderId(order.id);

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
        ? {
            number: order.table.number,
            zone: order.table.zone,
          }
        : null,
      subtotal: order.subtotal,
      taxRate: order.taxRate,
      taxAmount: order.taxAmount,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      business: {
        companyName: config?.companyName ?? 'POS Pizza',
        ruc: config?.ruc ?? null,
        address: config?.address ?? null,
        phone: config?.phone ?? null,
        logoUrl: config?.logoUrl ?? null,
        currency: config?.currency ?? 'PEN',
        ticketHeader: config?.ticketHeader ?? null,
        ticketFooter: config?.ticketFooter ?? null,
      },
      tracking: trackingRecord
        ? {
            code: trackingRecord.trackingCode,
            estimatedMinutes: trackingRecord.estimatedMinutes,
            qrData: trackingRecord.qrData,
          }
        : null,
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
}
