import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export type AccessOverrides = {
	features?: string[];
	expiresAt?: string | null;
	reason?: string;
};

export const appUser = pgTable("app_user", {
	userId: text("user_id").primaryKey(),
	stripeCustomerId: text("stripe_customer_id").unique(),
	stripeCoursePassCheckoutSessionId: text(
		"stripe_course_pass_checkout_session_id",
	).unique(),
	coursePassGrantedAt: timestamp("course_pass_granted_at", {
		withTimezone: true,
	}),
	coursePassRevokedAt: timestamp("course_pass_revoked_at", {
		withTimezone: true,
	}),
	accessOverrides: jsonb("access_overrides").$type<AccessOverrides>(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const lessonProgress = pgTable(
	"lesson_progress",
	{
		userId: text("user_id")
			.notNull()
			.references(() => appUser.userId, { onDelete: "cascade" }),
		lessonId: text("lesson_id").notNull(),
		contentVersion: integer("content_version").notNull(),
		lastPositionSeconds: integer("last_position_seconds"),
		startedAt: timestamp("started_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

export type AppUser = typeof appUser.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;

export const lessonAttempt = pgTable(
	"lesson_attempt",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => appUser.userId, { onDelete: "cascade" }),
		lessonId: text("lesson_id").notNull(),
		scenarioId: text("scenario_id").notNull(),
		scenarioVersion: integer("scenario_version").notNull(),
		status: text("status", { enum: ["in_progress", "submitted", "retired"] })
			.notNull()
			.default("in_progress"),
		revision: integer("revision").notNull().default(0),
		state: jsonb("state").$type<unknown>().notNull(),
		assessment: jsonb("assessment").$type<unknown>(),
		lastCommandId: text("last_command_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		submittedAt: timestamp("submitted_at", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("lesson_attempt_active_user_lesson")
			.on(table.userId, table.lessonId)
			.where(sql`${table.status} = 'in_progress'`),
		index("lesson_attempt_user_lesson_created").on(
			table.userId,
			table.lessonId,
			table.createdAt,
		),
		check("lesson_attempt_revision_nonnegative", sql`${table.revision} >= 0`),
		check("lesson_attempt_version_positive", sql`${table.scenarioVersion} > 0`),
		check(
			"lesson_attempt_status_valid",
			sql`${table.status} in ('in_progress', 'submitted', 'retired')`,
		),
	],
);

export type LessonAttempt = typeof lessonAttempt.$inferSelect;
