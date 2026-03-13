import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../drizzle/db';
import {
  orders,
  orderItems,
  orderStatusHistory,
} from '../drizzle/schema/orders.schema';
import { tables } from '../drizzle/schema/tables.schema';
import { cashRegisters } from '../drizzle/schema/payments.schema';
import { eq } from 'drizzle-orm';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PaymentsService } from '../payments/payments.service';
import { CashRegisterService } from '../cash-register/cash-register.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly notifications: NotificationsGateway,
    private readonly payments: PaymentsService,
    private readonly cashRegister: CashRegisterService,
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
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (!userId) {
      throw new BadRequestException(
        'No authenticated user found for order creation',
      );
    }

    let actualCashRegisterId = cashRegisterId;

    // Resolve tableId from tableNumber (optional)
    let resolvedTableId: string | null = tableId || null;
    let resolvedTableNumber: number | null = null;

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
        throw new BadRequestException('Numero de mesa invalido');
      }

      const table = await db.query.tables.findFirst({
        where: eq(tables.number, num),
      });
      if (!table) {
        throw new BadRequestException(`La mesa ${num} no existe`);
      }

      resolvedTableId = table.id;
      resolvedTableNumber = table.number;
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

    // Recalculate totals
    let subtotal = 0;
    const orderItemsPayload = items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: itemSubtotal,
        notes: item.notes || null,
        variantName: item.variantName || null,
      };
    });

    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate real ticket sequence
    const ticketNumber = await this.cashRegister.generateNextTicketNumber();

    try {
      // Execute everything in a Drizzle Transaction
      const result = await db.transaction(async (tx) => {
        console.log('--- STARTING DB TRANSACTION ---');
        console.log('Payload UUIDs:', { userId, actualCashRegisterId });

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

        await tx.insert(orderStatusHistory).values({
          orderId: newOrder.id,
          status: newOrder.status,
          changedBy: userId,
        });

        // 2. Insert Order Items
        const orderItemsToInsert = orderItemsPayload.map((item: any) => ({
          ...item,
          orderId: newOrder.id,
        }));

        const insertedItems = await tx
          .insert(orderItems)
          .values(orderItemsToInsert)
          .returning();

        // 3. Process Payment via Strategy Pattern
        const paymentResult = await this.payments.processPayment(
          tx,
          newOrder.id,
          {
            method: paymentMethod,
            amount: total,
            cashReceived: cashReceived,
            referenceNumber: referenceNumber,
          },
        );

        const realtimeOrder = {
          id: newOrder.id,
          ticketNumber: newOrder.ticketNumber,
          status: newOrder.status,
          orderType: newOrder.orderType,
          tableId: newOrder.tableId,
          table:
            resolvedTableNumber !== null
              ? { number: resolvedTableNumber }
              : null,
          customerName: newOrder.customerName,
          subtotal: newOrder.subtotal,
          taxAmount: newOrder.taxAmount,
          total: newOrder.total,
          createdAt: newOrder.createdAt,
          items: insertedItems.map((item: any) => ({
            id: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            notes: item.notes,
          })),
        };

        return {
          success: true,
          orderId: newOrder.id,
          ticketNumber: newOrder.ticketNumber,
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
      throw new BadRequestException(
        error.detail || error.message || 'Failed to process order transaction',
      );
    }
  }

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
    if (!order) throw new BadRequestException('Order not found');
    return order;
  }

  async findByTicketNumber(ticketNumber: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.ticketNumber, ticketNumber),
      with: {
        items: true,
        statusHistory: true,
      },
    });
    if (!order)
      throw new BadRequestException('No se encontró el pedido con ese ticket.');

    const safeItems = Array.isArray((order as any).items)
      ? (order as any).items
      : [];

    const safeHistory = Array.isArray((order as any).statusHistory)
      ? (order as any).statusHistory
      : [];

    // Return only safe public data (no userId, cashRegisterId)
    return {
      id: order.id,
      ticketNumber: order.ticketNumber,
      status: order.status,
      orderType: order.orderType,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
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

    if (!updatedOrder) throw new BadRequestException('Order not found');

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
    });

    if (!existing) throw new BadRequestException('Order not found');
    if (existing.status === 'DELIVERED') {
      throw new BadRequestException('No se puede cancelar un pedido entregado');
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

    if (!updatedOrder) throw new BadRequestException('Order not found');

    await db.insert(orderStatusHistory).values({
      orderId: updatedOrder.id,
      status: 'CANCELLED',
      changedBy: cancelledBy || null,
      notes: reason || null,
    });

    this.notifications.emitOrderCancelled(id);
    this.notifications.emitOrderStatusUpdate(id, 'CANCELLED', updatedOrder);

    return updatedOrder;
  }
}
