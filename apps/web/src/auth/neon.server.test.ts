import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	request: new Request("https://www.tradely.ai/learn/option-contracts"),
	setCookie: vi.fn(),
	proxy: vi.fn(),
	env: {
		NEON_AUTH_BASE_URL: "https://auth.example.neon.tech/neondb/auth/" as
			| string
			| undefined,
		NEON_AUTH_COOKIE_SECRET:
			"test-cookie-secret-at-least-thirty-two-characters" as string | undefined,
	},
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tanstack/react-start/server", () => ({
	getRequest: () => mocks.request,
	setCookie: mocks.setCookie,
}));
vi.mock("@tradely/env/server", () => ({ env: mocks.env }));
vi.mock("@neondatabase/auth/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("@neondatabase/auth/server")>()),
	handleAuthProxyRequest: mocks.proxy,
}));

import {
	createRequestContext,
	getAuthServer,
	proxyAuthRequest,
} from "./neon.server";

describe("TanStack Start Neon Auth adapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.env.NEON_AUTH_BASE_URL =
			"https://auth.example.neon.tech/neondb/auth/";
		mocks.env.NEON_AUTH_COOKIE_SECRET =
			"test-cookie-secret-at-least-thirty-two-characters";
		mocks.proxy.mockImplementation(async () =>
			Response.json(
				{ ok: true },
				{ headers: { "Set-Cookie": "session=opaque; HttpOnly; Secure" } },
			),
		);
		mocks.request = new Request(
			"https://www.tradely.ai/learn/option-contracts",
			{
				headers: {
					Cookie: "analytics=private; __Secure-neon-auth.session_token=opaque",
				},
			},
		);
	});
	it("binds each server call to its own request and forwards only auth cookies", async () => {
		const first = createRequestContext();
		expect(await first.getCookies()).toBe(
			"__Secure-neon-auth.session_token=opaque",
		);
		expect(await first.getOrigin()).toBe("https://www.tradely.ai");
		mocks.request = new Request("https://preview.example/", {
			headers: { Cookie: "__Secure-neon-auth.session_token=second" },
		});
		const second = createRequestContext();
		expect(await first.getCookies()).toContain("opaque");
		expect(await second.getCookies()).toContain("second");
		expect(first.getFramework()).toBe("tanstack-start");
		const options = {
			httpOnly: true,
			secure: true,
			sameSite: "lax" as const,
			path: "/",
			maxAge: 60,
		};
		await first.setCookie("session", "opaque", options);
		expect(mocks.setCookie).toHaveBeenCalledWith("session", "opaque", options);
	});
	it.each([null, "https://evil.example", "https://preview.example"])(
		"rejects auth POST from %s before contacting Neon",
		async (origin) => {
			const request = new Request(
				"https://www.tradely.ai/api/auth/sign-in/email-otp",
				{ method: "POST", headers: origin ? { Origin: origin } : {} },
			);
			expect(
				(await proxyAuthRequest(request, "sign-in/email-otp")).status,
			).toBe(403);
			expect(mocks.proxy).not.toHaveBeenCalled();
		},
	);
	it("rejects a cross-site request even with a matching supplied Origin", async () => {
		const request = new Request("https://www.tradely.ai/api/auth/sign-out", {
			method: "POST",
			headers: {
				Origin: "https://www.tradely.ai",
				"Sec-Fetch-Site": "cross-site",
			},
		});
		expect((await proxyAuthRequest(request, "sign-out")).status).toBe(403);
	});
	it("routes same-origin auth calls through the SDK and prevents response caching", async () => {
		const request = new Request(
			"https://www.tradely.ai/api/auth/email-otp/send-verification-otp",
			{
				method: "POST",
				headers: { Origin: "https://www.tradely.ai" },
				body: JSON.stringify({ email: "learner@example.com", type: "sign-in" }),
			},
		);
		const response = await proxyAuthRequest(
			request,
			"email-otp/send-verification-otp",
		);
		expect(mocks.proxy).toHaveBeenCalledWith(
			expect.objectContaining({
				request,
				path: "email-otp/send-verification-otp",
				baseUrl: "https://auth.example.neon.tech/neondb/auth",
				sameSite: "lax",
			}),
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(response.headers.getSetCookie()).toEqual([
			"session=opaque; HttpOnly; Secure",
		]);
	});
	it.each(["../admin", "//external", "sign-in/%2e%2e/admin", ""])(
		"rejects an invalid proxy path %s",
		async (path) => {
			expect(
				(
					await proxyAuthRequest(
						new Request("https://www.tradely.ai/api/auth/test"),
						path,
					)
				).status,
			).toBe(404);
			expect(mocks.proxy).not.toHaveBeenCalled();
		},
	);
	it("fails closed when authentication is not configured", async () => {
		mocks.env.NEON_AUTH_COOKIE_SECRET = undefined;
		expect(getAuthServer()).toBeNull();
		expect(
			(
				await proxyAuthRequest(
					new Request("https://www.tradely.ai/api/auth/get-session"),
					"get-session",
				)
			).status,
		).toBe(503);
		expect(mocks.proxy).not.toHaveBeenCalled();
	});
});
