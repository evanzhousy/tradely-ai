export type AuthSignInMethod = "email_otp" | "google";

const PENDING_AUTH_SIGN_IN_KEY = "tradely_pending_auth_sign_in_v1";
const MAX_PENDING_AUTH_SIGN_IN_AGE_MS = 15 * 60 * 1000;

type PendingAuthSignIn = {
	method: AuthSignInMethod;
	createdAt: number;
};

export function markPendingAuthSignIn(method: AuthSignInMethod): void {
	try {
		const value: PendingAuthSignIn = { method, createdAt: Date.now() };
		window.sessionStorage.setItem(
			PENDING_AUTH_SIGN_IN_KEY,
			JSON.stringify(value),
		);
	} catch {
		// Auth must keep working when browser storage is unavailable.
	}
}

export function clearPendingAuthSignIn(): void {
	try {
		window.sessionStorage.removeItem(PENDING_AUTH_SIGN_IN_KEY);
	} catch {
		// Best effort only.
	}
}

export function consumePendingAuthSignIn(): AuthSignInMethod | null {
	try {
		const raw = window.sessionStorage.getItem(PENDING_AUTH_SIGN_IN_KEY);
		window.sessionStorage.removeItem(PENDING_AUTH_SIGN_IN_KEY);
		if (!raw) return null;
		const value = JSON.parse(raw) as Partial<PendingAuthSignIn>;
		if (
			(value.method !== "email_otp" && value.method !== "google") ||
			typeof value.createdAt !== "number" ||
			Date.now() - value.createdAt > MAX_PENDING_AUTH_SIGN_IN_AGE_MS
		) {
			return null;
		}
		return value.method;
	} catch {
		return null;
	}
}
