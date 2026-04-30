ALTER TABLE "printer_configs" RENAME COLUMN "type" TO "connection_type";--> statement-breakpoint
ALTER TABLE "printer_configs" ADD COLUMN "location" text NOT NULL;--> statement-breakpoint
ALTER TABLE "printer_configs" ADD COLUMN "port" integer;--> statement-breakpoint
ALTER TABLE "printer_configs" ADD COLUMN "paper_width" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "printer_configs" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "printer_configs" ADD COLUMN "created_at" timestamp NOT NULL;