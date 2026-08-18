import "@tanstack/react-start/server-only";

import { type AppUser, appUser, createDb } from "@tradely/db";
import { eq } from "drizzle-orm";

import { manualGrantIsActive } from "@/domain/access";

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
