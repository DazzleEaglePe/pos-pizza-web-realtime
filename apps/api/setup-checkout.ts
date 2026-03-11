import { db } from './src/drizzle/db';
import { cashRegisters } from './src/drizzle/schema/payments.schema';
import { tables } from './src/drizzle/schema/tables.schema';
import { users } from './src/drizzle/schema/auth.schema';

async function main() {
  const [user] = await db.select().from(users).limit(1);
  
  // Register
  const [register] = await db.insert(cashRegisters).values({
    status: 'OPEN',
    userId: user.id,
    openingAmount: 150.00,
  }).returning();
  
  // Table
  const [table] = await db.insert(tables).values({
    number: 1,
    capacity: 4,
    status: 'AVAILABLE'
  }).returning();

  console.log("USER_ID=", user.id);
  console.log("REGISTER_ID=", register.id);
  console.log("TABLE_ID=", table.id);
  
  process.exit(0);
}

main();
