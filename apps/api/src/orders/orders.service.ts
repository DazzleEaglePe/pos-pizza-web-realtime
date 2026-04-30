import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  orders,
  orderItems,
  orderItemModifiers,
  orderStatusHistory,
} from '../drizzle/schema/orders.schema';
import { tables } from '../drizzle/schema/tables.schema';
import { cashRegisters } from '../drizzle/schema/payments.schema';
import { eq } from 'drizzle-orm';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PaymentsService } from '../payments/payments.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { TrackingService } from '../tracking/tracking.service';
import { InventoryService } from '../inventory/inventory.service';
import { BusinessConfigService } from '../config/config.service';
import { OrdersRepository } from './orders.repository';
import { buildOrderItemsPayload, calculateTotals } from './order-calculations';
import { validateAndApplyPromotions } from './promotion-validator';

@Injectable()
export class OrdersService {
  constructor(
    private readonly notifications: NotificationsGateway,
    private readonly payments: PaymentsService,
    private readonly cashRegister: CashRegisterService,
    private readonly tracking: TrackingService,
    private readonly inventory: InventoryService,
    private readonly businessConfig: BusinessConfigService,
    private readonly repository: OrdersRepository,
  ) {}
  async create(createOrderDto: any) {
    const {
      orderType,
      tableId,
      tableNumber,
      customerName,
      userId,
      cashRegisterId,
      items,
      // Payment fields
      paymentMethod = 'CASH',
      cashReceived,
      referenceNumber,
      cashAmount,
      digitalAmount,
      digitalMethod,
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new HttpException(
        { code: 'ORDER_ITEMS_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!userId) {
      throw new HttpException(
        { code: 'AUTH_REQUIRED' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    let actualCashRegisterId = cashRegisterId;

    // Resolve tableId from tableNumber/tableId
    let resolvedTableId: string | null = tableId || null;
    let resolvedTableNumber: number | null = null;
    let resolvedTableZone: string | null = null;

    const isDineIn = orderType === 'DINE_IN' || orderType === 'SALON';
    if (
      isDineIn &&
      !resolvedTableId &&
      tableNumber !== undefined &&
      tableNumber !== null &&
      tableNumber !== ''
    ) {
      const num = Number(tableNumber);
      if (!Number.isInteger(num) || num <= 0) {
        throw new HttpException(
          { code: 'TABLE_INVALID', details: { tableNumber } },
          HttpStatus.BAD_REQUEST,
        );
      }

      const table = await db.query.tables.findFirst({
        where: eq(tables.number, num),
      });
      if (!table) {
        throw new HttpException(
          { code: 'TABLE_NOT_FOUND', details: { tableNumber: num } },
          HttpStatus.NOT_FOUND,
        );
      }

      resolvedTableId = table.id;
      resolvedTableNumber = table.number;
      resolvedTableZone = table.zone || null;
    }

    if (isDineIn && resolvedTableId) {
      const table = await db.query.tables.findFirst({
        where: eq(tables.id, resolvedTableId),
      });

      if (!table) {
        throw new HttpException(
          { code: 'TABLE_NOT_FOUND', details: { tableId: resolvedTableId } },
          HttpStatus.NOT_FOUND,
        );
      }

      resolvedTableNumber = table.number;
      resolvedTableZone = table.zone || null;
    }

    if (isDineIn && !resolvedTableId) {
      throw new HttpException(
        { code: 'TABLE_REQUIRED' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Auto-resolve Cash Register for the real current user if not provided by frontend
    if (!actualCashRegisterId) {
      let register = await this.cashRegister.getActiveRegister(userId);
      if (!register) {
        // For MVP: Auto-open a mock cash register so the flow doesn't break
        const [newRegister] = await db
          .insert(cashRegisters)
          .values({
            userId: userId,
            openingAmount: 100,
            status: 'OPEN',
          })
          .returning();
        register = newRegister;
      }
      actualCashRegisterId = register.id;
    }

    // Validate promotions and overwrite prices with DB promoPrice
    const promotionSnapshots = await validateAndApplyPromotions(items);

    // Recalculate totals (tax-inclusive pricing model)
    const { payload: orderItemsPayload, grossTotal } = buildOrderItemsPayload(items);

    const taxRate = await this.businessConfig.getTaxRateDecimal();
    const { taxAmount, subtotal, total } = calculateTotals(grossTotal, taxRate);

    // Generate real ticket sequence
    const ticketNumber = await this.cashRegister.generateNextTicketNumber();

    try {
      // Execute everything in a Drizzle Transaction
      const result = await db.transaction(async (tx) => {
        // 1. Create the Order
        const [newOrder] = await tx
          .insert(orders)
          .values({
            ticketNumber,
            orderType: orderType || 'DINE_IN',
            tableId: resolvedTableId,
            customerName: customerName || null,
            userId: userId,
            cashRegisterId: actualCashRegisterId,
            status: 'RECEIVED',
            subtotal,
            taxRate,
            taxAmount,
            total,
          })
          .returning();

        if (resolvedTableId) {
          await tx
            .update(tables)
            .set({ status: 'OCCUPIED' })
            .where(eq(tables.id, resolvedTableId));
        }

        await tx.insert(orderStatusHistory).values({
          orderId: newOrder.id,
          status: newOrder.status,
          changedBy: userId,
        });

        // 2. Insert Order Items (strip internal _modifiers field)
        const orderItemsToInsert = orderItemsPayload.map((item: any) => {
          const { _modifiers: _, ...rest } = item;
          return { ...rest, orderId: newOrder.id };
        });

        const insertedItems = await tx
          .insert(orderItems)
          .values(orderItemsToInsert)
          .returning();

        // 2b. Insert selected modifiers per item
        for (let i = 0; i < orderItemsPayload.length; i++) {
          const mods = orderItemsPayload[i]._modifiers;
          if (mods.length > 0) {
            await tx.insert(orderItemModifiers).values(
              mods.map((m: { id: string; name: string; price: number }) => ({
                orderItemId: insertedItems[i].id,
                modifierId: m.id,
                modifierName: m.name,
                price: Number(m.price || 0),
              })),
            );
          }
        }

        // 3. Process Payment via Strategy Pattern
        const paymentResult = await this.payments.processPayment(
          tx,
          newOrder.id,
          {
            method: paymentMethod,
            amount: total,
            cashReceived: cashReceived,
            referenceNumber: referenceNumber,
            cashAmount: cashAmount,
            digitalAmount: digitalAmount,
            digitalMethod: digitalMethod,
          },
        );

        // 4. Deduct Inventory (automatic stock reduction)
        await this.inventory.deductByOrder(
          tx,
          newOrder.id,
          orderItemsPayload.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        );

        // 5. Generate Tracking (code + QR + estimated time)
        const productIds = orderItemsPayload.map(
          (item: any) => item.productId as string | null,
        );
        const trackingResult = await this.tracking.createTracking(
          tx,
          newOrder.id,
          newOrder.ticketNumber,
          productIds,
        );

        const realtimeOrder = {
          id: newOrder.id,
          ticketNumber: newOrder.ticketNumber,
          status: newOrder.status,
          orderType: newOrder.orderType,
          tableId: newOrder.tableId,
          table:
            resolvedTableNumber !== null
              ? { number: resolvedTableNumber, zone: resolvedTableZone }
              : null,
          customerName: newOrder.customerName,
          subtotal: newOrder.subtotal,
          taxAmount: newOrder.taxAmount,
          total: newOrder.total,
          createdAt: newOrder.createdAt,
          trackingCode: trackingResult.trackingCode,
          items: insertedItems.map((item: any, idx: number) => ({
            id: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            notes: item.notes,
            modifierNames: orderItemsPayload[idx]._modifiers.map(
              (m: any) => m.name,
            ),
          })),
        };

        return {
          success: true,
          orderId: newOrder.id,
          ticketNumber: newOrder.ticketNumber,
          trackingCode: trackingResult.trackingCode,
          trackingUrl: trackingResult.trackingUrl,
          qrData: trackingResult.qrData,
          estimatedMinutes: trackingResult.estimatedMinutes,
          total: newOrder.total,
          payment: paymentResult,
          order: realtimeOrder,
        };
      });

      // Emit real-time event to all connected clients (Kitchen, Dashboard)
      if (result?.order) {
        this.notifications.emitNewOrder(result.order);
      } else {
        this.notifications.emitNewOrder({
          id: result.orderId,
          ticketNumber: result.ticketNumber,
          status: 'RECEIVED',
          orderType: orderType || 'DINE_IN',
          tableId: tableId || null,
          customerName: customerName || null,
          createdAt: new Date(),
          items: [],
        });
      }

      return result;
    } catch (error: any) {
      console.error('Failed to create order. Full Error:', error);
      throw new HttpException(
        {
          code: 'ORDER_CREATE_FAILED',
          details: {
            message: error?.detail || error?.message || 'Unknown error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findActive() {
    return this.repository.findActive();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async findByTicketNumber(ticketNumber: string) {
    return this.repository.findByTicketNumber(ticketNumber);
  }

  async updateStatus(id: string, status: string, changedBy?: string) {
    const now = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: now,
        ...(status === 'DELIVERED' ? { deliveredAt: now } : {}),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { orderId: id } },
        HttpStatus.NOT_FOUND,
      );
    }

    await db.insert(orderStatusHistory).values({
      orderId: updatedOrder.id,
      status,
      changedBy: changedBy || null,
    });

    // Emit real-time status update
    this.notifications.emitOrderStatusUpdate(id, status, updatedOrder);

    return updatedOrder;
  }

  async cancelOrder(id: string, reason: string | null, cancelledBy?: string) {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!existing) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { orderId: id } },
        HttpStatus.NOT_FOUND,
      );
    }
    if (existing.status === 'DELIVERED') {
      throw new HttpException(
        { code: 'ORDER_CANNOT_CANCEL_DELIVERED', details: { orderId: id } },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existing.status === 'CANCELLED') return existing;

    const now = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'CANCELLED',
        cancellationReason: reason || null,
        cancelledBy: cancelledBy || null,
        updatedAt: now,
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      throw new HttpException(
        { code: 'ORDER_NOT_FOUND', details: { orderId: id } },
        HttpStatus.NOT_FOUND,
      );
    }

    await db.insert(orderStatusHistory).values({
      orderId: updatedOrder.id,
      status: 'CANCELLED',
      changedBy: cancelledBy || null,
      notes: reason || null,
    });

    // Restore inventory on cancellation
    const orderItemsList = (existing as any).items || [];
    if (orderItemsList.length > 0) {
      await this.inventory.restoreByOrder(
        id,
        orderItemsList.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        cancelledBy,
      );
    }

    this.notifications.emitOrderCancelled(id);
    this.notifications.emitOrderStatusUpdate(id, 'CANCELLED', updatedOrder);

    return updatedOrder;
  }
}
