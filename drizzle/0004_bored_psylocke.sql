CREATE TABLE "stud_booking_matings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"mating_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stud_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"stud_service_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"client_whatsapp" text NOT NULL,
	"queen_name" text NOT NULL,
	"queen_breed" text,
	"queen_age_text" text,
	"planned_date" date,
	"status" text DEFAULT 'requested' NOT NULL,
	"fee_agreed" integer,
	"deposit_amount" integer,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"expected_due_date" date,
	"expected_due_date_manual" boolean DEFAULT false NOT NULL,
	"queen_pregnancy_status" text DEFAULT 'unknown' NOT NULL,
	"notes" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stud_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_id" uuid,
	"cat_name" text NOT NULL,
	"owner_id" text NOT NULL,
	"fee_amount" integer,
	"fee_description" text,
	"notes" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stud_booking_matings" ADD CONSTRAINT "stud_booking_matings_booking_id_stud_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."stud_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stud_bookings" ADD CONSTRAINT "stud_bookings_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stud_bookings" ADD CONSTRAINT "stud_bookings_stud_service_id_stud_services_id_fk" FOREIGN KEY ("stud_service_id") REFERENCES "public"."stud_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stud_services" ADD CONSTRAINT "stud_services_cat_id_cats_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stud_services" ADD CONSTRAINT "stud_services_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stud_booking_matings_booking_id_idx" ON "stud_booking_matings" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "stud_booking_matings_mating_date_idx" ON "stud_booking_matings" USING btree ("mating_date");--> statement-breakpoint
CREATE INDEX "stud_bookings_owner_id_idx" ON "stud_bookings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "stud_bookings_stud_service_id_idx" ON "stud_bookings" USING btree ("stud_service_id");--> statement-breakpoint
CREATE INDEX "stud_bookings_status_idx" ON "stud_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stud_bookings_planned_date_idx" ON "stud_bookings" USING btree ("planned_date");--> statement-breakpoint
CREATE INDEX "stud_services_owner_id_idx" ON "stud_services" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stud_services_cat_id_uidx" ON "stud_services" USING btree ("cat_id");