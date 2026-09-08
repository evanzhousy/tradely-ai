-- Fresh-start identity cutover. Existing rows are prelaunch test data.
-- Auth-provider accounts themselves are managed by Neon Auth.
TRUNCATE TABLE "lesson_attempt", "lesson_progress", "app_user";
--> statement-breakpoint
ALTER TABLE "app_user" RENAME COLUMN "clerk_user_id" TO "user_id";
--> statement-breakpoint
ALTER TABLE "lesson_progress" RENAME COLUMN "clerk_user_id" TO "user_id";
--> statement-breakpoint
ALTER TABLE "lesson_attempt" RENAME COLUMN "clerk_user_id" TO "user_id";
--> statement-breakpoint
ALTER TABLE "lesson_progress" RENAME CONSTRAINT "lesson_progress_clerk_user_id_lesson_id_pk" TO "lesson_progress_user_id_lesson_id_pk";
--> statement-breakpoint
ALTER TABLE "lesson_progress" RENAME CONSTRAINT "lesson_progress_clerk_user_id_app_user_clerk_user_id_fk" TO "lesson_progress_user_id_app_user_user_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_attempt" RENAME CONSTRAINT "lesson_attempt_clerk_user_id_app_user_clerk_user_id_fk" TO "lesson_attempt_user_id_app_user_user_id_fk";
