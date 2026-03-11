import { db } from './db';
import { users } from './schema/auth.schema';
import * as bcrypt from 'bcrypt';

async function fixPasswords() {
  console.log('🔑 Fixing user passwords with proper bcrypt hashes...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Update ALL users to have the correct bcrypt hash
  await db.update(users).set({ passwordHash: hashedPassword });
  
  console.log('✅ All passwords updated successfully!');
  console.log('   📧 admin@pospizza.com → admin123');
  console.log('   📧 caja@pospizza.com  → admin123');
  process.exit(0);
}

fixPasswords().catch((err) => {
  console.error('❌ Error fixing passwords:', err);
  process.exit(1);
});
