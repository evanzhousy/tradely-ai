import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { authClient, useAuth } from "./client";

it("initializes the same-origin auth client during server rendering without a browser URL", () => {
	function SessionStatus() {
		const { isLoaded } = useAuth();
		return <span>{isLoaded ? "ready" : "loading"}</span>;
	}
	expect(typeof authClient.emailOtp.sendVerificationOtp).toBe("function");
	expect(renderToString(<SessionStatus />)).toContain("loading");
});
