CREATE TABLE "cat_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"file_path" text,
	"file_type" text DEFAULT 'pdf' NOT NULL,
	"size_bytes" integer,
	"uploaded_at" date NOT NULL,
	"source" text,
	"notes" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeding_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid NOT NULL,
	"schedule_time" text NOT NULL,
	"portion_grams" integer NOT NULL,
	"food_type" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"record_date" date NOT NULL,
	"next_due_date" date,
	"weight_kg" numeric(4, 2),
	"vet_name" text,
	"cost" integer,
	"photo_path" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cat_id" uuid,
	"title" text NOT NULL,
	"due_date" date NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid,
	"done_at" timestamp with time zone,
	"notified_h3_at" timestamp with time zone,
	"notified_d0_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cat_documents" ADD CONSTRAINT "cat_documents_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeding_schedules" ADD CONSTRAINT "feeding_schedules_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cat_documents_cat_id_idx" ON "cat_documents" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "cat_documents_uploaded_at_idx" ON "cat_documents" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "feeding_schedules_cat_id_idx" ON "feeding_schedules" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "health_records_cat_id_idx" ON "health_records" USING btree ("cat_id");--> statement-breakpoint
CREATE INDEX "health_records_cat_date_idx" ON "health_records" USING btree ("cat_id","record_date");--> statement-breakpoint
CREATE INDEX "health_records_type_idx" ON "health_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_due_date_idx" ON "reminders" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "reminders_source_idx" ON "reminders" USING btree ("source_type","source_id");