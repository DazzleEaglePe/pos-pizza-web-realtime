import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../drizzle/db';
import { users } from '../drizzle/schema/auth.schema';
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  async findAll(search?: string) {
    const conditions = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )
      : undefined;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt));

    return rows;
  }

  async findOne(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const { passwordHash, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const normalized = (dto.email || '').trim().toLowerCase();
    if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
      throw new BadRequestException('EMAIL_INVALID');
    }
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('PASSWORD_TOO_SHORT');
    }
    const validRoles = ['ADMIN', 'CAJERO', 'COCINA'];
    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException('INVALID_ROLE');
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalized),
    });
    if (existing) throw new ConflictException('EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [created] = await db
      .insert(users)
      .values({
        email: normalized,
        passwordHash,
        name: (dto.name || '').trim() || normalized.split('@')[0],
        role: dto.role,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return created;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (dto.name !== undefined) {
      const trimmed = (dto.name || '').trim();
      if (trimmed.length < 2) throw new BadRequestException('NAME_TOO_SHORT');
      updates.name = trimmed;
    }

    if (dto.role !== undefined) {
      const validRoles = ['ADMIN', 'CAJERO', 'COCINA'];
      if (!validRoles.includes(dto.role)) throw new BadRequestException('INVALID_ROLE');
      updates.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      });

    return updated;
  }

  async resetPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('PASSWORD_TOO_SHORT');
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));

    return { success: true };
  }
}
