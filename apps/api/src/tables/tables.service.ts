import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { tables } from '../drizzle/schema/tables.schema';
import { asc, eq } from 'drizzle-orm';

@Injectable()
export class TablesService {
  async listActive() {
    return await db.query.tables.findMany({
      where: eq(tables.isActive, true),
      orderBy: asc(tables.number),
    });
  }
}
