import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { tables } from '../drizzle/schema/tables.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { and, asc, eq, inArray } from 'drizzle-orm';

const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED'] as const;
type TableStatus = (typeof TABLE_STATUSES)[number];

const ACTIVE_ORDER_STATUSES = [
  'RECEIVED',
  'PREPARING',
  'IN_OVEN',
  'READY',
] as const;

@Injectable()
export class TablesService {
  async listActive() {
    return await db.query.tables.findMany({
      where: eq(tables.isActive, true),
      orderBy: asc(tables.number),
    });
  }

  async updateStatus(
    tableId: string,
    args: { status: string; force?: boolean; reason?: string },
    user?: { id?: string; role?: string },
  ) {
    const desired = String(args?.status || '').toUpperCase();

    if (!TABLE_STATUSES.includes(desired as TableStatus)) {
      throw new HttpException(
        {
          code: 'TABLE_STATUS_INVALID',
          details: { status: desired, allowed: TABLE_STATUSES },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const table = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });
    if (!table) {
      throw new HttpException(
        { code: 'TABLE_NOT_FOUND', details: { tableId } },
        HttpStatus.NOT_FOUND,
      );
    }

    const role = String(user?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN';

    // Prevent accidental release when there are active orders.
    if (desired === 'AVAILABLE') {
      const activeOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.tableId, tableId),
          inArray(orders.status, [...ACTIVE_ORDER_STATUSES]),
        ),
        columns: {
          id: true,
          ticketNumber: true,
          status: true,
          createdAt: true,
        },
      });

      if (activeOrders.length > 0) {
        const details = {
          tableId,
          count: activeOrders.length,
          orders: activeOrders.map((o) => ({
            id: o.id,
            ticketNumber: o.ticketNumber,
            status: o.status,
            createdAt: o.createdAt,
          })),
          canForce: isAdmin,
        };

        if (!isAdmin || args?.force !== true) {
          throw new HttpException(
            { code: 'TABLE_HAS_ACTIVE_ORDERS', details },
            HttpStatus.CONFLICT,
          );
        }
      }
    }

    const [updated] = await db
      .update(tables)
      .set({ status: desired })
      .where(eq(tables.id, tableId))
      .returning();

    return updated || table;
  }
}
