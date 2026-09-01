import "@tanstack/react-start/server-only";

import { type AppUser, appUser, createDb } from "@tradely/db";
import { eq } from "drizzle-orm";
import { coursePassIsActive, manualGrantIsActive } from "@/domain/access";

export async function findAppUser(
	clerkUserId: string,
): Promise<AppUser | null> {
	const db = createDb();
	const [user] = await db
		.select()
		.from(appUser)
		.where(eq(appUser.clerkUserId, clerkUserId))
		.limit(1);
	return user ?? null;
}

export async function ensureAppUser(clerkUserId: string): Promise<AppUser> {
	const db = createDb();
	const [user] = await db
		.insert(appUser)
		.values({ clerkUserId })
		.onConflictDoUpdate({
			target: appUser.clerkUserId,
			set: { updatedAt: new Date() },
		})
		.returning();
	if (!user) throw new Error("Unable to provision Tradely user");
	return user;
}

export async function updateStripeCustomerId(
	clerkUserId: string,
	stripeCustomerId: string,
): Promise<void> {
	const db = createDb();
	await db
		.update(appUser)
		.set({ stripeCustomerId, updatedAt: new Date() })
		.where(eq(appUser.clerkUserId, clerkUserId));
}

export function hasManualAllAccess(user: AppUser | null): boolean {
	return manualGrantIsActive(user?.accessOverrides);
}

export function hasActiveCoursePass(user: AppUser | null): boolean {
	return coursePassIsActive(user);
}

export async function grantCoursePass(
	clerkUserId: string,
	checkoutSessionId: string,
): Promise<void> {
	const user = await ensureAppUser(clerkUserId);
	if (
		user.stripeCoursePassCheckoutSessionId === checkoutSessionId &&
		user.coursePassRevokedAt
	) {
		throw new Error("This course pass purchase has been revoked");
	}
	if (
		user.stripeCoursePassCheckoutSessionId === checkoutSessionId &&
		coursePassIsActive(user)
	)
		return;
	if (coursePassIsActive(user)) return;
	const now = new Date();
	const db = createDb();
	await db
		.update(appUser)
		.set({
			stripeCoursePassCheckoutSessionId: checkoutSessionId,
			coursePassGrantedAt: now,
			coursePassRevokedAt: null,
			updatedAt: now,
		})
		.where(eq(appUser.clerkUserId, clerkUserId));
}

export async function revokeCoursePass(clerkUserId: string): Promise<void> {
	const now = new Date();
	const db = createDb();
	await db
		.update(appUser)
		.set({ coursePassRevokedAt: now, updatedAt: now })
		.where(eq(appUser.clerkUserId, clerkUserId));
}
