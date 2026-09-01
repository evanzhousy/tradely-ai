ALTER TABLE "app_user" ADD COLUMN "stripe_course_pass_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "course_pass_granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "course_pass_revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_stripe_course_pass_checkout_session_id_unique" UNIQUE("stripe_course_pass_checkout_session_id");