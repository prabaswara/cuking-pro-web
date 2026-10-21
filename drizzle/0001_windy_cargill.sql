CREATE TABLE "cat_ownership_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid,
	"cat_name" text NOT NULL,
	"owner_id" text,
	"owner_display_name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"acquired_via" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"sex" text NOT NULL,
	"breed" text,
	"color" text,
	"birth_date" date,
	"photo_path" text,
	"is_neutered" boolean DEFAULT false NOT NULL,
	"microchip_no" text,
	"pedigree_no" text,
	"sire_id" uuid,
	"sire_name_manual" text,
	"dam_id" uuid,
	"dam_name_manual" text,
	"status" text DEFAULT 'active' NOT NULL,
	"tracking_status" text DEFAULT 'tracked' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"price_idr" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"whatsapp" text,
	"kennel_name" text,
	"avatar_path" text,
	"is_breeder" boolean DEFAULT false NOT NULL,
	"is_stud_provider" boolean DEFAULT false NOT NULL,
	"email_reminders_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cat_ownership_history" ADD CONSTRAINT "cat_ownership_history_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_ownership_history" ADD CONSTRAINT "cat_ownership_history_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cats" ADD CONSTRAINT "cats_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cats" ADD CONSTRAINT "cats_sire_id_cats_id_fk" FOREIGN KEY ("sire_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cats" ADD CONSTRAINT "cats_dam_id_cats_id_fk" FOREIGN KEY ("dam_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cat_ownership_history_cat_id_idx" ON "cat_ownership_history" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "cat_ownership_history_owner_id_idx" ON "cat_ownership_history" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cat_ownership_history_current_uidx" ON "cat_ownership_history" USING btree ("cat_id") WHERE "cat_ownership_history"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "cats_owner_id_idx" ON "cats" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cats_status_idx" ON "cats" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_ends_at_idx" ON "subscriptions" USING btree ("ends_at");