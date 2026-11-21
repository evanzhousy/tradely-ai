import { createFileRoute } from "@tanstack/react-router";

/** Tradely's MCP server (Streamable HTTP) for AI assistants; see src/server/mcp.server.ts. */
const handle = async ({ request }: { request: Request }) => {
	const { handleMcpRequest } = await import("@/server/mcp.server");
	return handleMcpRequest(request);
};

export const Route = createFileRoute("/mcp")({
	server: {
		handlers: { GET: handle, POST: handle, DELETE: handle },
	},
});
