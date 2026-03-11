import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../drizzle/db';
import { users } from '../drizzle/schema/auth.schema';
import { eq } from 'drizzle-orm';

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
}
