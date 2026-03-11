import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../drizzle/db';
import { orders, orderItems } from '../drizzle/schema/orders.schema';
import { eq } from 'drizzle-orm';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrdersService {
  constructor(private readonly notifications: NotificationsGateway) {}
  async create(createOrderDto: any) {
    const { orderType, tableId, customerName, userId, cashRegisterId, items } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Default mock IDs if not provided (for early development testing without full auth)
    // NOTE: In production, userId comes from JWT and cashRegisterId from session state.
    const actualUserId = userId || '0807336e-9eff-4432-a4b6-d62f9a7b0c25'; 
    const actualCashRegisterId = cashRegisterId || 'a9e66058-f8b6-4601-aef9-3d2d322f224d'; 

    // Recalculate totals
    let subtotal = 0;
    const orderItemsPayload = items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
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

    // Generate a quick ticket number (In production, use a sequence table)
    const ticketNumber = `TKT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    try {
      // Execute everything in a Drizzle Transaction
      const result = await db.transaction(async (tx) => {
        // 1. Create the Order
        const [newOrder] = await tx.insert(orders).values({
          ticketNumber,
          orderType: orderType || 'DINE_IN',
          tableId: tableId || null,
          customerName: customerName || null,
          userId: actualUserId,
          cashRegisterId: actualCashRegisterId,
          status: 'RECEIVED',
          subtotal,
          taxRate,
          taxAmount,
          total,
        }).returning();

        // 2. Insert Order Items
        const orderItemsToInsert = orderItemsPayload.map((item: any) => ({
          ...item,
          orderId: newOrder.id,
        }));

        await tx.insert(orderItems).values(orderItemsToInsert);

        return {
          success: true,
          orderId: newOrder.id,
          ticketNumber: newOrder.ticketNumber,
          total: newOrder.total,
        };
      });

      // Emit real-time event to all connected clients (Kitchen, Dashboard)
      this.notifications.emitNewOrder(result);

      return result;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new BadRequestException('Failed to process order transaction');
    }
  }

  async findAll() {
    return await db.query.orders.findMany({
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
  }

  async findOne(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
      }
    });
    if (!order) throw new BadRequestException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: string) {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) throw new BadRequestException('Order not found');

    // Emit real-time status update
    this.notifications.emitOrderStatusUpdate(id, status, updatedOrder);

    return updatedOrder;
  }
}
