import { Injectable } from '@nestjs/common';
import { db } from '../drizzle/db';
import { businessConfig } from '../drizzle/schema/config.schema';

@Injectable()
export class BusinessConfigService {
  private cachedConfig: typeof businessConfig.$inferSelect | null = null;

  async getConfig() {
    if (!this.cachedConfig) {
      const row = await db.query.businessConfig.findFirst();
      if (row) {
        this.cachedConfig = row;
      }
    }
    return this.cachedConfig;
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
