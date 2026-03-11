import { db } from './src/drizzle/db';
import { users } from './src/drizzle/schema/auth.schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function setPassword() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, 'admin@pospizza.com'));
  console.log("Password updated successfully!");
  process.exit(0);
}
setPassword();
