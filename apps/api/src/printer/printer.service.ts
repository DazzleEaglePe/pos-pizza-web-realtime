import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../drizzle/db';
import { printerConfigs } from '../drizzle/schema/config.schema';
import { eq, and, ne, asc } from 'drizzle-orm';

@Injectable()
export class PrinterService {
  async findAll() {
    return db
      .select()
      .from(printerConfigs)
      .orderBy(asc(printerConfigs.location), asc(printerConfigs.name));
  }

  async create(dto: {
    name: string;
    location: string;
    connectionType: string;
    ipAddress?: string | null;
    port?: number | null;
    paperWidth?: number;
    isActive?: boolean;
  }) {
    const [printer] = await db
      .insert(printerConfigs)
      .values({
        name: dto.name,
        location: dto.location,
        connectionType: dto.connectionType,
        ipAddress: dto.ipAddress ?? null,
        port: dto.port ?? null,
        paperWidth: dto.paperWidth ?? 80,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return printer;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      location?: string;
      connectionType?: string;
      ipAddress?: string | null;
      port?: number | null;
      paperWidth?: number;
      isActive?: boolean;
    },
  ) {
    const [updated] = await db
      .update(printerConfigs)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.connectionType !== undefined && { connectionType: dto.connectionType }),
        ...(dto.ipAddress !== undefined && { ipAddress: dto.ipAddress }),
        ...(dto.port !== undefined && { port: dto.port }),
        ...(dto.paperWidth !== undefined && { paperWidth: dto.paperWidth }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      })
      .where(eq(printerConfigs.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Printer not found');
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await db
      .delete(printerConfigs)
      .where(eq(printerConfigs.id, id))
      .returning();
    if (!deleted) throw new NotFoundException('Printer not found');
    return { success: true };
  }

  async setDefault(id: string) {
    // Find the printer to get its location
    const [printer] = await db
      .select()
      .from(printerConfigs)
      .where(eq(printerConfigs.id, id));
    if (!printer) throw new NotFoundException('Printer not found');

    // Unset default for all printers in the same location
    await db
      .update(printerConfigs)
      .set({ isDefault: false })
      .where(
        and(
          eq(printerConfigs.location, printer.location),
          ne(printerConfigs.id, id),
        ),
      );

    // Set this printer as default
    const [updated] = await db
      .update(printerConfigs)
      .set({ isDefault: true })
      .where(eq(printerConfigs.id, id))
      .returning();
    return updated;
  }
}
