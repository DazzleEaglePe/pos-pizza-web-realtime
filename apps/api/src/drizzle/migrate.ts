import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log('⏳ Running PostgreSQL migrations programmatically...');
  try {
    const migrationPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const migrationDb = drizzle(migrationPool);
    
    await migrate(migrationDb, { migrationsFolder: './src/drizzle/migrations' });
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to apply migrations', err);
    process.exit(1);
  }
}

runMigrations();
