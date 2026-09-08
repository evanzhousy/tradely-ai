import "@tanstack/react-start/server-only";

import {
	createAuthServer,
	extractNeonAuthCookies,
	handleAuthProxyRequest,
	NEON_AUTH_SESSION_COOKIE_NAME,
	parseCookieValue,
	type RequestContext,
	resolveNeonAuthLogging,
} from "@neondatabase/auth/server";
import { getRequest, setCookie } from "@tanstack/react-start/server";
import { env } from "@tradely/env/server";

export function createRequestContext(): RequestContext {
	const request = getRequest();
	return {
		getCookies: () => extractNeonAuthCookies(request.headers),
		setCookie: (name, value, options) => setCookie(name, value, options),
		getHeader: (name) => request.headers.get(name),
		getOrigin: () =>
			request.headers.get("origin") ?? new URL(request.url).origin,
		getFramework: () => "tanstack-start",
	};
}

function configuration() {
	if (!env.NEON_AUTH_BASE_URL || !env.NEON_AUTH_COOKIE_SECRET) return null;
	return {
		baseUrl: env.NEON_AUTH_BASE_URL.replace(/\/+$/, ""),
		cookieSecret: env.NEON_AUTH_COOKIE_SECRET,
		sessionDataTtl: 60,
		// Keep the session on top-level returns from Stripe and email clients.
		sameSite: "lax" as const,
		// Keep upstream identity and credential details out of application logs.
		log: resolveNeonAuthLogging({ logLevel: "silent" }),
	};
}

export function getAuthServer() {
	const config = configuration();
	return config
		? createAuthServer({ ...config, context: createRequestContext })
		: null;
}

export async function readAuthSession() {
	const server = getAuthServer();
	if (
		!server ||
		!parseCookieValue(
			await createRequestContext().getCookies(),
			NEON_AUTH_SESSION_COOKIE_NAME,
		)
	) {
		return { data: null, error: null };
	}
	return server.getSession();
}

const privateHeaders = {
	"Cache-Control": "private, no-store",
	Vary: "Cookie, Origin",
};

export async function proxyAuthRequest(
	request: Request,
	path: string,
): Promise<Response> {
	const config = configuration();
	if (!config)
		return Response.json(
			{ message: "Sign-in is unavailable" },
			{ status: 503, headers: privateHeaders },
		);
	if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
		return new Response(null, { status: 404, headers: privateHeaders });
	}
	if (request.method !== "GET" && request.method !== "POST") {
		return new Response(null, {
			status: 405,
			headers: { ...privateHeaders, Allow: "GET, POST" },
		});
	}
	if (
		request.method === "POST" &&
		(request.headers.get("origin") !== new URL(request.url).origin ||
			request.headers.get("sec-fetch-site") === "cross-site")
	) {
		return Response.json(
			{ message: "Invalid request origin" },
			{ status: 403, headers: privateHeaders },
		);
	}
	const response = await handleAuthProxyRequest({ ...config, request, path });
	response.headers.set("Cache-Control", "private, no-store");
	response.headers.set("Vary", "Cookie, Origin");
	return response;
}
