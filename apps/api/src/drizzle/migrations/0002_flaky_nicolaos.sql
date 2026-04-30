ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "promotion_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;