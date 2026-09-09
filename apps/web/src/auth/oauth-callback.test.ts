import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetch: vi.fn(),
	request: new Request("https://www.tradely.ai/"),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tanstack/react-start/server", () => ({
	getRequest: () => mocks.request,
	setCookie: vi.fn(),
}));
vi.mock("@tradely/env/server", () => ({
	env: {
		NEON_AUTH_BASE_URL: "https://auth.example.neon.tech/neondb/auth",
		NEON_AUTH_COOKIE_SECRET:
			"isolated-oauth-test-secret-at-least-thirty-two-characters",
	},
}));

import {
	NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME,
	NEON_AUTH_SESSION_COOKIE_NAME,
	NEON_AUTH_SESSION_DATA_COOKIE_NAME,
} from "@neondatabase/auth/server";
import { getCurrentIdentity } from "@/server/auth.server";
import { completeOAuthRequest } from "./neon.server";

const user = {
	id: "google-learner",
	email: "learner@example.com",
	name: "Learner",
	emailVerified: true,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};
const session = {
	id: "google-session",
	userId: user.id,
	token: "session-token",
	expiresAt: new Date(Date.now() + 3600000).toISOString(),
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};
function callback(
	returnTo = "/learn/audited-boundary?tab=practice#notes",
	challenge = true,
) {
	const url = new URL("https://www.tradely.ai/auth/callback");
	url.searchParams.set("returnTo", returnTo);
	url.searchParams.set("neon_auth_session_verifier", "one-time-verifier");
	return new Request(url, {
		headers: challenge
			? {
					Cookie: `${NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME}=browser-challenge`,
				}
			: {},
	});
}

describe("OAuth callback using the real Neon server toolkit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
		mocks.fetch.mockImplementation(async (input: string) => {
			const url = new URL(input);
			if (!url.pathname.endsWith("/get-session"))
				throw new Error("Unexpected upstream");
			const headers = new Headers();
			if (url.searchParams.has("neon_auth_session_verifier")) {
				headers.append(
					"Set-Cookie",
					`${NEON_AUTH_SESSION_COOKIE_NAME}=session-token; Path=/; Secure; HttpOnly; SameSite=None; Partitioned`,
				);
				headers.append(
					"Set-Cookie",
					`${NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME}=; Max-Age=0; Path=/; Secure; HttpOnly`,
				);
			}
			return Response.json({ user, session }, { headers });
		});
	});
	afterEach(() => vi.unstubAllGlobals());

	it("exchanges the verifier, sets every SDK cookie, and authenticates the next server request", async () => {
		const response = await completeOAuthRequest(callback());
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://www.tradely.ai/learn/audited-boundary?tab=practice#notes",
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
		const cookies = response.headers.getSetCookie();
		expect(
			cookies.some((c) =>
				c.startsWith(`${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=`),
			),
		).toBe(true);
		expect(
			cookies.some(
				(c) =>
					c.startsWith(`${NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME}=`) &&
					c.includes("Max-Age=0"),
			),
		).toBe(true);
		expect(
			cookies.every(
				(c) =>
					/Secure/i.test(c) &&
					/HttpOnly/i.test(c) &&
					/SameSite=Lax/i.test(c) &&
					!/Partitioned/i.test(c),
			),
		).toBe(true);
		mocks.request = new Request(
			"https://www.tradely.ai/learn/audited-boundary",
			{
				headers: {
					Cookie: cookies
						.filter(
							(c) =>
								!c.startsWith(`${NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME}=`),
						)
						.map((c) => c.split(";")[0])
						.join("; "),
				},
			},
		);
		mocks.fetch.mockClear();
		expect(await getCurrentIdentity()).toEqual({
			userId: user.id,
			email: user.email,
		});
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it.each([
		"https://evil.example",
		"//evil.example",
		"/auth/sign-in",
		"/api/auth/sign-out",
	])("rejects unsafe return destination %s", async (returnTo) => {
		expect(
			(await completeOAuthRequest(callback(returnTo))).headers.get("Location"),
		).toBe("https://www.tradely.ai/");
	});

	it("rejects a verifier without the initiating browser challenge", async () => {
		const response = await completeOAuthRequest(callback("/pricing", false));
		expect(
			new URL(response.headers.get("Location") ?? "").searchParams.get(
				"oauthError",
			),
		).toBe("google");
		expect(response.headers.getSetCookie()).toEqual([]);
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it.each(["denied", "network"])(
		"fails closed on %s without exposing upstream details",
		async (failure) => {
			if (failure === "network")
				mocks.fetch.mockRejectedValue(new Error("upstream-secret"));
			else
				mocks.fetch.mockImplementation(async () =>
					Response.json({ message: "upstream-secret" }, { status: 401 }),
				);
			const response = await completeOAuthRequest(callback());
			const location = response.headers.get("Location") ?? "";
			expect(new URL(location).pathname).toBe("/auth/sign-in");
			expect(new URL(location).searchParams.get("oauthError")).toBe("google");
			expect(location).not.toMatch(/upstream-secret|one-time-verifier/);
			expect(response.headers.getSetCookie()).toEqual([]);
		},
	);

	it("handles provider cancellation without forwarding its query details", async () => {
		const response = await completeOAuthRequest(
			new Request(
				"https://www.tradely.ai/auth/callback?error=access_denied&error_description=private-provider-detail&returnTo=%2Fpricing",
			),
		);
		expect(response.headers.get("Location")).toBe(
			"https://www.tradely.ai/auth/sign-in?returnTo=%2Fpricing&oauthError=google",
		);
		expect(await response.text()).toBe("");
		expect(mocks.fetch).not.toHaveBeenCalled();
	});
});
