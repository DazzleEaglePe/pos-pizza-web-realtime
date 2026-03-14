import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../drizzle/db';
import { users } from '../drizzle/schema/auth.schema';
import { eq } from 'drizzle-orm';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  async register(email: string, pass: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name: email.split('@')[0], // Extract name from email
      role: 'ADMIN', // Defaulting to ADMIN for this quick start
    }).returning();
    
    return this.login(newUser);
  }

  async getProfile(userId: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedException('INVALID_SESSION');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async updateProfile(userId: string, name: string) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw new BadRequestException('NAME_REQUIRED');
    }

    if (trimmedName.length < 2) {
      throw new BadRequestException('NAME_TOO_SHORT');
    }

    const [updated] = await db
      .update(users)
      .set({
        name: trimmedName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new UnauthorizedException('INVALID_SESSION');
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    };
  }

  async updateEmail(userId: string, email: string) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('EMAIL_REQUIRED');
    }

    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      throw new BadRequestException('EMAIL_INVALID');
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalized),
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const [updated] = await db
      .update(users)
      .set({
        email: normalized,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new UnauthorizedException('INVALID_SESSION');
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    };
  }

  async changePassword(userId: string, body: ChangePasswordDto) {
    const currentPassword = (body.currentPassword || '').trim();
    const newPassword = (body.newPassword || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new BadRequestException('PASSWORD_FIELDS_REQUIRED');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('PASSWORD_TOO_SHORT');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('PASSWORD_CONFIRMATION_MISMATCH');
    }

    if (newPassword === currentPassword) {
      throw new BadRequestException('PASSWORD_MUST_CHANGE');
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedException('INVALID_SESSION');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('CURRENT_PASSWORD_INVALID');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const [updated] = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!updated) {
      throw new UnauthorizedException('INVALID_SESSION');
    }
  }
}
