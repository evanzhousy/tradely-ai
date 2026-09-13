import "@tanstack/react-start/server-only";
import { getCurrentUserId } from "./auth.server";

/** Optional account state never restricts the public curriculum. */
export async function getLearningIdentity() {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const userId = await Promise.race([
			getCurrentUserId(),
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error("Account lookup timed out")),
					1500,
				);
			}),
		]);
		return { userId, isSignedIn: Boolean(userId), unavailable: false };
	} catch {
		return { userId: null, isSignedIn: false, unavailable: true };
	} finally {
		if (timer) clearTimeout(timer);
	}
}
