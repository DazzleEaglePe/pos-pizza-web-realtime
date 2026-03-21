import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { notifications } from '../drizzle/schema/config.schema';
import { eq, and, desc, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  async create(data: {
    userId?: string | null;
    title: string;
    message: string;
    type: string;
  }) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId ?? null,
        title: data.title,
        message: data.message,
        type: data.type,
      })
      .returning();
    return notification;
  }

  async findByUser(userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    return db
      .select()
      .from(notifications)
      .where(
        or(eq(notifications.userId, userId), isNull(notifications.userId)),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async unreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          or(eq(notifications.userId, userId), isNull(notifications.userId)),
          eq(notifications.isRead, false),
        ),
      );
    return result?.count ?? 0;
  }

  async markAsRead(id: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          or(eq(notifications.userId, userId), isNull(notifications.userId)),
          eq(notifications.isRead, false),
        ),
      );
    return { success: true };
  }
}
