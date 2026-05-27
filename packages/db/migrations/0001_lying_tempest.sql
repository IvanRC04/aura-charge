ALTER TABLE "customers" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "lat" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "lng" numeric(9, 6);