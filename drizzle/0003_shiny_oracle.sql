CREATE TABLE "cat_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"cat_id" uuid,
	"cat_name" text NOT NULL,
	"status" text DEFAULT 'listed' NOT NULL,
	"asking_price" integer,
	"buyer_name" text,
	"buyer_whatsapp" text,
	"final_price" integer,
	"deposit_amount" integer,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"sale_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heat_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "litters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mating_id" uuid NOT NULL,
	"birth_date" date NOT NULL,
	"total_born" integer NOT NULL,
	"total_alive" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"queen_id" uuid,
	"queen_name_manual" text,
	"sire_id" uuid,
	"sire_name_manual" text,
	"mating_date" date NOT NULL,
	"outcome" text DEFAULT 'pending' NOT NULL,
	"expected_due_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cats" ADD COLUMN "litter_id" uuid;--> statement-breakpoint
ALTER TABLE "cat_sales" ADD CONSTRAINT "cat_sales_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_sales" ADD CONSTRAINT "cat_sales_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_cycles" ADD CONSTRAINT "heat_cycles_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litters" ADD CONSTRAINT "litters_mating_id_matings_id_fk" FOREIGN KEY ("mating_id") REFERENCES "public"."matings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matings" ADD CONSTRAINT "matings_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matings" ADD CONSTRAINT "matings_queen_id_cats_id_fk" FOREIGN KEY ("queen_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matings" ADD CONSTRAINT "matings_sire_id_cats_id_fk" FOREIGN KEY ("sire_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cat_sales_owner_id_idx" ON "cat_sales" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cat_sales_status_idx" ON "cat_sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cat_sales_sale_date_idx" ON "cat_sales" USING btree ("sale_date");--> statement-breakpoint
CREATE UNIQUE INDEX "cat_sales_active_cat_uidx" ON "cat_sales" USING btree ("cat_id") WHERE "cat_sales"."status" in ('listed', 'reserved');--> statement-breakpoint
CREATE INDEX "heat_cycles_cat_id_idx" ON "heat_cycles" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "heat_cycles_start_date_idx" ON "heat_cycles" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "litters_mating_id_uidx" ON "litters" USING btree ("mating_id");--> statement-breakpoint
CREATE INDEX "litters_birth_date_idx" ON "litters" USING btree ("birth_date");--> statement-breakpoint
CREATE INDEX "matings_owner_id_idx" ON "matings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "matings_mating_date_idx" ON "matings" USING btree ("mating_date");--> statement-breakpoint
CREATE INDEX "matings_outcome_idx" ON "matings" USING btree ("outcome");--> statement-breakpoint
ALTER TABLE "cats" ADD CONSTRAINT "cats_litter_id_litters_id_fk" FOREIGN KEY ("litter_id") REFERENCES "public"."litters"("id") ON DELETE set null ON UPDATE no action;