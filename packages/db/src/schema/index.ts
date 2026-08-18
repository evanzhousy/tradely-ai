import {
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export type AccessOverrides = {
	features?: string[];
	expiresAt?: string | null;
	reason?: string;
};

export const appUser = pgTable("app_user", {
	clerkUserId: text("clerk_user_id").primaryKey(),
	stripeCustomerId: text("stripe_customer_id").unique(),
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
		clerkUserId: text("clerk_user_id")
			.notNull()
			.references(() => appUser.clerkUserId, { onDelete: "cascade" }),
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
	(table) => [primaryKey({ columns: [table.clerkUserId, table.lessonId] })],
);

export type AppUser = typeof appUser.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
