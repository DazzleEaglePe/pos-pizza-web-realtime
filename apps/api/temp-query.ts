import { db } from './src/drizzle/db';
import { users } from './src/drizzle/schema/auth.schema';
import { cashRegisters } from './src/drizzle/schema/payments.schema';

async function main() {
  const userList = await db.select().from(users).limit(1);
  const registerList = await db.select().from(cashRegisters).limit(1);
  console.log("USER:", userList[0]?.id);
  console.log("REGISTER:", registerList[0]?.id);
  process.exit(0);
}
main();
