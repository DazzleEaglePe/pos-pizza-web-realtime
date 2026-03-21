import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { db } from '../drizzle/db';
import { users, sessions } from '../drizzle/schema/auth.schema';
import { eq, and } from 'drizzle-orm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditService } from '../audit/audit.service';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

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

  private async generateTokenPair(user: { id: string; email: string; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async login(user: any) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const { accessToken, refreshToken } = await this.generateTokenPair(user);

    // Audit login
    this.auditService
      .log({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'auth',
        details: { email: user.email },
      })
      .catch(() => {});

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('REFRESH_TOKEN_REQUIRED');
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshToken, refreshToken),
          eq(sessions.isRevoked, false),
        ),
      )
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('REFRESH_TOKEN_EXPIRED');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, session.userId), eq(users.isActive, true)))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('INVALID_SESSION');
    }

    // Revoke old session (rotation)
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.id, session.id));

    // Generate new pair
    const tokens = await this.generateTokenPair(user);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string, userId?: string) {
    if (!refreshToken) return;
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.refreshToken, refreshToken));

    // Audit logout
    if (userId) {
      this.auditService
        .log({
          userId,
          action: 'LOGOUT',
          entityType: 'auth',
        })
        .catch(() => {});
    }
  }

  private async revokeAllSessions(userId: string) {
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(and(eq(sessions.userId, userId), eq(sessions.isRevoked, false)));
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

    // Revoke all sessions — force re-login everywhere
    await this.revokeAllSessions(userId);
  }
}
