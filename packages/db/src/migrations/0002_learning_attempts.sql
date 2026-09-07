CREATE TABLE "lesson_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"scenario_version" integer NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"assessment" jsonb,
	"last_command_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "lesson_attempt_revision_nonnegative" CHECK ("lesson_attempt"."revision" >= 0),
	CONSTRAINT "lesson_attempt_version_positive" CHECK ("lesson_attempt"."scenario_version" > 0),
	CONSTRAINT "lesson_attempt_status_valid" CHECK ("lesson_attempt"."status" in ('in_progress', 'submitted', 'retired'))
);
--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_clerk_user_id_app_user_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."app_user"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_attempt_active_user_lesson" ON "lesson_attempt" USING btree ("clerk_user_id","lesson_id") WHERE "lesson_attempt"."status" = 'in_progress';--> statement-breakpoint
CREATE INDEX "lesson_attempt_user_lesson_created" ON "lesson_attempt" USING btree ("clerk_user_id","lesson_id","created_at");