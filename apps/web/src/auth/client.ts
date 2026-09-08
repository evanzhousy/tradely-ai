import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { env } from "@tradely/env/web";

// An empty base URL uses the SDK's same-origin /api/auth default, including
// during SSR where there is no browser origin to resolve a relative URL.
export const authClient = createAuthClient("", {
	adapter: BetterAuthReactAdapter(),
});

export const authIsConfigured = env.VITE_AUTH_ENABLED === true;

export function useAuth() {
	const { data, isPending, error } = authClient.useSession();
	return {
		isLoaded: !isPending,
		isSignedIn: Boolean(data?.user?.emailVerified),
		userId: data?.user?.emailVerified ? data.user.id : null,
		email: data?.user?.email ?? null,
		error,
	};
}
