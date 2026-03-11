import fs from 'fs';
import path from 'path';

const schemaDir = path.join(process.cwd(), 'src', 'drizzle', 'schema');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.schema.ts'));

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix any previous messy imports
  content = content.replace(/drizzle-orm\/pg-core";`nimport { uuid } from "drizzle-orm\/pg-core"/g, 'drizzle-orm/pg-core"');
  content = content.replace(/drizzle-orm\/pg-core";\r?\nimport { uuid } from "drizzle-orm\/pg-core"/g, 'drizzle-orm/pg-core"');

  // First convert any sqlite code to pg code
  content = content.replace(/drizzle-orm\/sqlite-core/g, 'drizzle-orm/pg-core');
  content = content.replace(/sqliteTable/g, 'pgTable');

  // Add missing uuid to import ONLY ONE TIME
  if (!content.includes('uuid,') && !content.includes(', uuid') && content.includes('drizzle-orm/pg-core"')) {
    content = content.replace(/import {([^}]+)} from "drizzle-orm\/pg-core";/, 'import { uuid, $1 } from "drizzle-orm/pg-core";');
  }

  // Replace ID generation (uuid instead of text for Postgres)
  content = content.replace(/text\("id"\)\.primaryKey\(\)\.\$defaultFn\(\(\) => crypto\.randomUUID\(\)\)/g, 'uuid("id").defaultRandom().primaryKey()');

  // Replace timestamp logic (timestamp for pg)
  content = content.replace(/integer\('([^']+)', { mode: "timestamp" }\)/g, 'timestamp(\'$1\')');
  content = content.replace(/integer\("([^"]+)", { mode: "timestamp" }\)/g, 'timestamp("$1")');
  
  if (content.includes('timestamp') && !content.includes('timestamp,')) {
    content = content.replace(/import {([^}]+)} from "drizzle-orm\/pg-core";/, 'import { timestamp, $1 } from "drizzle-orm/pg-core";');
  }

  // Replace boolean logic (boolean for pg)
  content = content.replace(/integer\('([^']+)', { mode: "boolean" }\)/g, 'boolean(\'$1\')');
  content = content.replace(/integer\("([^"]+)", { mode: "boolean" }\)/g, 'boolean("$1")');
  
  if (content.includes('boolean') && !content.includes('boolean,')) {
    content = content.replace(/import {([^}]+)} from "drizzle-orm\/pg-core";/, 'import { boolean, $1 } from "drizzle-orm/pg-core";');
  }

  // Double check our import doesn't have duplicate uuids now
  content = content.replace(/uuid,\s*uuid,/g, 'uuid,');
  
  fs.writeFileSync(filePath, content);
  console.log(`Converted ${file}`);
}
