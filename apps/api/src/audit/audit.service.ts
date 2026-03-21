import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { auditLogs, users } from '../drizzle/schema/auth.schema';
import { eq, desc, and, sql, between, SQL } from 'drizzle-orm';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  async log(input: AuditLogInput) {
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details: input.details ?? null,
      ipAddress: input.ipAddress ?? null,
    });
  }

  async findAll(filters: {
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.entityType)
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.from && filters.to) {
      conditions.push(
        between(auditLogs.createdAt, new Date(filters.from), new Date(filters.to)),
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(where),
    ]);

    return {
      data: rows,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async findEntityHistory(
    entityType: string,
    entityId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const offset = (page - 1) * Math.min(limit, 100);

    const conditions = [
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId),
    ];

    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(Math.min(limit, 100))
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(where),
    ]);

    return {
      data: rows,
      total: countResult[0]?.count ?? 0,
      page,
      limit: Math.min(limit, 100),
    };
  }
}
