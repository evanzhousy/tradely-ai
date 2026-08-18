import "@tanstack/react-start/server-only";

import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { env } from "@tradely/env/server";

export async function getCurrentClerkUserId(): Promise<string | null> {
	if (!env.CLERK_SECRET_KEY) return null;
	const session = await auth();
	return session.userId ?? null;
}

export async function getCurrentClerkIdentity(): Promise<{
	userId: string;
	email: string | null;
} | null> {
	const userId = await getCurrentClerkUserId();
	if (!userId || !env.CLERK_SECRET_KEY) return null;
	const user = await clerkClient({
		secretKey: env.CLERK_SECRET_KEY,
	}).users.getUser(userId);
	const primaryEmail = user.emailAddresses.find(
		(email) => email.id === user.primaryEmailAddressId,
	)?.emailAddress;
	return {
		userId,
		email: primaryEmail ?? user.emailAddresses[0]?.emailAddress ?? null,
	};
}
