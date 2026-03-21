ALTER TABLE "payment_transactions" ADD COLUMN "cash_amount" real;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "digital_amount" real;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "digital_method" text;