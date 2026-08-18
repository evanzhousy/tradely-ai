CREATE TABLE "app_user" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"access_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"clerk_user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"content_version" integer NOT NULL,
	"last_position_seconds" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_clerk_user_id_lesson_id_pk" PRIMARY KEY("clerk_user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_clerk_user_id_app_user_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."app_user"("clerk_user_id") ON DELETE cascade ON UPDATE no action;