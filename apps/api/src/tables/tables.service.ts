import { HttpException, HttpStatus, Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../drizzle/db';
import { tables } from '../drizzle/schema/tables.schema';
import { orders } from '../drizzle/schema/orders.schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { NotificationsGateway } from '../notifications/notifications.gateway';

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
  constructor(private readonly gateway: NotificationsGateway) {}
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

    const result = updated || table;
    this.gateway.emitTableStatusUpdate({
      id: result.id,
      number: result.number,
      status: result.status,
    });

    return result;
  }

  async listAll() {
    return await db.query.tables.findMany({
      orderBy: asc(tables.number),
    });
  }

  async create(dto: { number: number; capacity: number; zone?: string }) {
    if (!dto.number || dto.number < 1) throw new BadRequestException('INVALID_TABLE_NUMBER');
    if (!dto.capacity || dto.capacity < 1) throw new BadRequestException('INVALID_CAPACITY');

    const existing = await db.query.tables.findFirst({
      where: eq(tables.number, dto.number),
    });
    if (existing) throw new ConflictException('TABLE_NUMBER_EXISTS');

    const [created] = await db.insert(tables).values({
      number: dto.number,
      capacity: dto.capacity,
      zone: dto.zone || null,
    }).returning();

    return created;
  }

  async updateTable(id: string, dto: { number?: number; capacity?: number; zone?: string; isActive?: boolean }) {
    const table = await db.query.tables.findFirst({ where: eq(tables.id, id) });
    if (!table) throw new NotFoundException('TABLE_NOT_FOUND');

    const updates: Record<string, unknown> = {};

    if (dto.number !== undefined) {
      if (dto.number < 1) throw new BadRequestException('INVALID_TABLE_NUMBER');
      if (dto.number !== table.number) {
        const existing = await db.query.tables.findFirst({
          where: eq(tables.number, dto.number),
        });
        if (existing) throw new ConflictException('TABLE_NUMBER_EXISTS');
      }
      updates.number = dto.number;
    }

    if (dto.capacity !== undefined) {
      if (dto.capacity < 1) throw new BadRequestException('INVALID_CAPACITY');
      updates.capacity = dto.capacity;
    }

    if (dto.zone !== undefined) updates.zone = dto.zone || null;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;

    const [updated] = await db.update(tables).set(updates).where(eq(tables.id, id)).returning();
    return updated;
  }

  async remove(id: string) {
    const table = await db.query.tables.findFirst({ where: eq(tables.id, id) });
    if (!table) throw new NotFoundException('TABLE_NOT_FOUND');

    // Soft delete: deactivate instead of hard-delete
    const [updated] = await db.update(tables).set({ isActive: false }).where(eq(tables.id, id)).returning();
    return updated;
  }
}
