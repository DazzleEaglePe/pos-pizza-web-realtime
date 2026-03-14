ALTER TABLE "inventory_items" ADD COLUMN "supplier" text;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "stock_after" real NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reference_type" text;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "unique_recipe" UNIQUE("product_id","variant_id","inventory_item_id");