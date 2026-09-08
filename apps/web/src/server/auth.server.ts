import "@tanstack/react-start/server-only";

import { readAuthSession } from "@/auth/neon.server";

export async function getCurrentIdentity(): Promise<{
	userId: string;
	email: string;
} | null> {
	const { data, error } = await readAuthSession().catch(() => {
		throw new Error("Authentication service unavailable");
	});
	if (error) throw new Error("Authentication service unavailable");
	if (!data?.session || !data.user?.emailVerified) return null;
	return { userId: data.user.id, email: data.user.email };
}

export async function getCurrentUserId(): Promise<string | null> {
	return (await getCurrentIdentity())?.userId ?? null;
}
