import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { businessConfig } from '../drizzle/schema/config.schema';
import { eq } from 'drizzle-orm';

type UpdateBusinessConfigInput = Partial<{
  companyName: string;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxRateDefault: number;
  currency: string;
  timezone: string;
  ticketHeader: string | null;
  ticketFooter: string | null;
  trackingBaseUrl: string | null;
  trackingExpiryHours: number;
  logoUrl: string | null;
}>;

@Injectable()
export class BusinessConfigService {
  private cachedConfig: typeof businessConfig.$inferSelect | null = null;

  private async ensureConfigRow() {
    const existing = await db.query.businessConfig.findFirst();
    if (existing) return existing;

    const [created] = await db
      .insert(businessConfig)
      .values({
        companyName: 'POS Pizza',
        taxRateDefault: 18,
        currency: 'PEN',
        timezone: 'America/Lima',
      })
      .returning();

    return created;
  }

  async getConfig() {
    if (!this.cachedConfig) {
      this.cachedConfig = await this.ensureConfigRow();
    }
    return this.cachedConfig;
  }

  async updateConfig(input: UpdateBusinessConfigInput) {
    const current = await this.ensureConfigRow();

    const [updated] = await db
      .update(businessConfig)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(businessConfig.id, current.id))
      .returning();

    this.cachedConfig = updated;
    return updated;
  }

  /** Returns the tax rate as a decimal (e.g. 0.18 for 18%) */
  async getTaxRateDecimal(): Promise<number> {
    const config = await this.getConfig();
    const pct = config?.taxRateDefault ?? 18;
    return pct / 100;
  }

  /** Returns the tax rate percentage (e.g. 18 for 18%) */
  async getTaxRatePercent(): Promise<number> {
    const config = await this.getConfig();
    return config?.taxRateDefault ?? 18;
  }

  /** Invalidate cached config (call after updating business_config) */
  clearCache() {
    this.cachedConfig = null;
  }
}
