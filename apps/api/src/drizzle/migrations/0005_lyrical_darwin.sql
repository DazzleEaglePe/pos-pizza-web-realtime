ALTER TABLE "business_config" ADD COLUMN "ruc" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "ticket_header" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "ticket_footer" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "tracking_base_url" text;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "tracking_expiry_hours" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "business_config" ADD COLUMN "logo_url" text;