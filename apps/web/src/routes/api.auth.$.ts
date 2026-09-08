import { createFileRoute } from "@tanstack/react-router";

async function handler({
	request,
	params,
}: {
	request: Request;
	params: { _splat?: string };
}) {
	const { proxyAuthRequest } = await import("@/auth/neon.server");
	return proxyAuthRequest(request, params._splat ?? "");
}

export const Route = createFileRoute("/api/auth/$")({
	server: { handlers: { GET: handler, POST: handler } },
});
