ALTER TABLE "audit_logs" ALTER COLUMN "details" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "business_config" ALTER COLUMN "settings" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "daily_summaries" ALTER COLUMN "metrics" SET DATA TYPE jsonb;