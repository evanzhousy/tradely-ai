import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), configured: true }));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@/auth/neon.server", () => ({
	readAuthSession: async () =>
		mocks.configured ? mocks.getSession() : { data: null, error: null },
}));

import { getCurrentIdentity, getCurrentUserId } from "./auth.server";

describe("verified server identity", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.configured = true;
	});
	it("accepts only a verified user backed by a session", async () => {
		mocks.getSession.mockResolvedValue({
			data: {
				session: { id: "session" },
				user: {
					id: "neon-user",
					email: "learner@example.com",
					emailVerified: true,
				},
			},
			error: null,
		});
		expect(await getCurrentIdentity()).toEqual({
			userId: "neon-user",
			email: "learner@example.com",
		});
		expect(await getCurrentUserId()).toBe("neon-user");
	});
	it.each([
		{ session: null, user: null },
		{ session: null, user: { id: "forged", emailVerified: true } },
		{
			session: { id: "session" },
			user: { id: "unverified", emailVerified: false },
		},
	])("denies missing or unverified identity", async (data) => {
		mocks.getSession.mockResolvedValue({ data, error: null });
		expect(await getCurrentIdentity()).toBeNull();
	});
	it("does not downgrade an auth outage into an anonymous session or expose upstream errors", async () => {
		mocks.getSession.mockResolvedValue({
			data: null,
			error: { message: "private credential detail" },
		});
		await expect(getCurrentIdentity()).rejects.toThrow(
			"Authentication service unavailable",
		);
	});
	it("has no identity when auth is disabled", async () => {
		mocks.configured = false;
		expect(await getCurrentUserId()).toBeNull();
		expect(mocks.getSession).not.toHaveBeenCalled();
	});
});
