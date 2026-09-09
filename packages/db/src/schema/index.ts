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

/** Formative coaching is separate from immutable lesson assessments. Costs are micro-USD. */
export const coachingSession = pgTable(
	"coaching_session",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => appUser.userId, { onDelete: "cascade" }),
		attemptId: text("attempt_id")
			.notNull()
			.references(() => lessonAttempt.id, { onDelete: "cascade" }),
		lessonId: text("lesson_id").notNull(),
		scenarioId: text("scenario_id").notNull(),
		scenarioVersion: integer("scenario_version").notNull(),
		rubricVersion: integer("rubric_version").notNull(),
		stepId: text("step_id").notNull(),
		locale: text("locale", { enum: ["en", "zh"] }).notNull(),
		draftReason: text("draft_reason").notNull().default(""),
		initialSnapshot: jsonb("initial_snapshot").$type<unknown>(),
		revisedSnapshot: jsonb("revised_snapshot").$type<unknown>(),
		revision: integer("revision").notNull().default(0),
		lastCommandId: text("last_command_id"),
		quotaDay: text("quota_day"),
		reservedMicros: integer("reserved_micros").notNull().default(0),
		model: text("model"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("coaching_session_attempt_step").on(
			table.attemptId,
			table.stepId,
		),
		index("coaching_session_user_day").on(table.userId, table.quotaDay),
		index("coaching_session_day").on(table.quotaDay),
		check(
			"coaching_session_valid",
			sql`${table.revision} >= 0 and ${table.reservedMicros} >= 0 and length(${table.draftReason}) <= 1800 and ${table.locale} in ('en', 'zh')`,
		),
	],
);
export const coachingGeneration = pgTable(
	"coaching_generation",
	{
		id: text("id").primaryKey(),
		sessionId: text("session_id")
			.notNull()
			.references(() => coachingSession.id, { onDelete: "cascade" }),
		round: text("round", { enum: ["initial", "revision"] }).notNull(),
		commandId: text("command_id").notNull(),
		inputHash: text("input_hash").notNull(),
		status: text("status", {
			enum: ["running", "succeeded", "failed", "indeterminate"],
		}).notNull(),
		model: text("model").notNull(),
		promptVersion: integer("prompt_version").notNull(),
		feedback: jsonb("feedback").$type<unknown>(),
		errorCode: text("error_code"),
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		costMicros: integer("cost_micros"),
		elapsedMs: integer("elapsed_ms"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		leaseExpiresAt: timestamp("lease_expires_at", {
			withTimezone: true,
		}).notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("coaching_generation_session_round").on(
			table.sessionId,
			table.round,
		),
		uniqueIndex("coaching_generation_command").on(table.commandId),
		check(
			"coaching_generation_valid",
			sql`${table.round} in ('initial', 'revision') and ${table.status} in ('running', 'succeeded', 'failed', 'indeterminate')`,
		),
	],
);
export type CoachingSessionRecord = typeof coachingSession.$inferSelect;
export type CoachingGenerationRecord = typeof coachingGeneration.$inferSelect;
