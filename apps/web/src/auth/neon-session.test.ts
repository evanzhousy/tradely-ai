import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	request: new Request("https://www.tradely.ai/"),
	setCookie: vi.fn(),
	fetch: vi.fn(),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tanstack/react-start/server", () => ({
	getRequest: () => mocks.request,
	setCookie: mocks.setCookie,
}));
vi.mock("@tradely/env/server", () => ({
	env: {
		NEON_AUTH_BASE_URL: "https://auth.example.neon.tech/neondb/auth",
		NEON_AUTH_COOKIE_SECRET:
			"isolated-test-cookie-secret-with-thirty-two-characters",
	},
}));

import {
	NEON_AUTH_SESSION_COOKIE_NAME,
	NEON_AUTH_SESSION_DATA_COOKIE_NAME,
} from "@neondatabase/auth/server";
import { getCurrentIdentity } from "@/server/auth.server";
import { proxyAuthRequest } from "./neon.server";

const user = {
	id: "a50d580e-fdb3-4c31-a87b-14f48d399eb9",
	email: "learner@example.com",
	name: "Learner",
	emailVerified: true,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};
const session = {
	id: "test-session",
	userId: user.id,
	token: "opaque-token",
	expiresAt: new Date(Date.now() + 3600000).toISOString(),
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

describe("Neon SDK session round trip with an isolated auth upstream", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
		mocks.request = new Request("https://www.tradely.ai/");
		mocks.fetch.mockImplementation(async (url: string) => {
			if (url.endsWith("/sign-in/email-otp"))
				return Response.json(
					{ user, session },
					{
						headers: {
							"Set-Cookie": `${NEON_AUTH_SESSION_COOKIE_NAME}=opaque-token; Path=/; Secure; HttpOnly; SameSite=None; Partitioned`,
						},
					},
				);
			if (url.endsWith("/get-session")) return Response.json({ user, session });
			throw new Error("Unexpected auth upstream URL");
		});
	});
	afterEach(() => vi.unstubAllGlobals());
	async function signInCookies() {
		const response = await proxyAuthRequest(
			new Request("https://www.tradely.ai/api/auth/sign-in/email-otp", {
				method: "POST",
				headers: {
					Origin: "https://www.tradely.ai",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: user.email, otp: "123456" }),
			}),
			"sign-in/email-otp",
		);
		expect(response.status).toBe(200);
		return response.headers.getSetCookie();
	}
	it("mints SDK-signed cookies and validates the same identity in a server function", async () => {
		const cookies = await signInCookies();
		expect(
			cookies.some((cookie) =>
				cookie.startsWith(`${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=`),
			),
		).toBe(true);
		expect(
			cookies.every(
				(cookie) =>
					/Secure/i.test(cookie) &&
					/HttpOnly/i.test(cookie) &&
					/SameSite=Lax/i.test(cookie) &&
					!/Partitioned/i.test(cookie),
			),
		).toBe(true);
		mocks.request = new Request(
			"https://www.tradely.ai/learn/option-contracts",
			{
				headers: {
					Cookie: cookies.map((cookie) => cookie.split(";")[0]).join("; "),
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
	it("does not accept a forged cached identity when the opaque session is invalid", async () => {
		const cookies = await signInCookies();
		const cached = cookies
			.find((cookie) =>
				cookie.startsWith(`${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=`),
			)
			?.split(";")[0];
		if (!cached) throw new Error("SDK did not mint a session cookie");
		const pieces = cached.slice(cached.indexOf("=") + 1).split(".");
		pieces[1] = Buffer.from(
			JSON.stringify({
				session,
				user: { ...user, id: "attacker-chosen-user" },
			}),
		).toString("base64url");
		mocks.request = new Request("https://www.tradely.ai/", {
			headers: {
				Cookie: `${NEON_AUTH_SESSION_COOKIE_NAME}=invalid-token; ${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=${pieces.join(".")}`,
			},
		});
		mocks.fetch.mockResolvedValue(Response.json({ session: null, user: null }));
		expect(await getCurrentIdentity()).toBeNull();
	});
	it("does not authenticate a cached cookie alone after logout", async () => {
		const cookies = await signInCookies();
		const cached = cookies
			.find((cookie) =>
				cookie.startsWith(`${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=`),
			)
			?.split(";")[0];
		if (!cached) throw new Error("SDK did not mint a session cookie");
		mocks.request = new Request("https://www.tradely.ai/", {
			headers: { Cookie: cached },
		});
		mocks.fetch.mockClear();
		expect(await getCurrentIdentity()).toBeNull();
		expect(mocks.fetch).not.toHaveBeenCalled();
	});
});
