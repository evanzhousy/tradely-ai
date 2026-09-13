import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ identity: vi.fn(), stripe: vi.fn() }));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("./auth.server", () => ({ getCurrentUserId: mocks.identity }));
vi.mock("./billing.server", () => ({ getStripeBillingState: mocks.stripe }));

import { tradingFlowCourse } from "@/content/course";
import { getLearningIdentity } from "./access.server";
import { getLessonPageDataImpl } from "./lesson.server";

describe("free learning identity", () => {
	beforeEach(() => vi.clearAllMocks());
	it.each([null, "ordinary-account"])(
		"never consults Stripe for %s",
		async (userId) => {
			mocks.identity.mockResolvedValue(userId);
			expect(await getLearningIdentity()).toEqual({
				userId,
				isSignedIn: Boolean(userId),
				unavailable: false,
			});
			expect(mocks.stripe).not.toHaveBeenCalled();
		},
	);
	it("bounds a stalled identity lookup so public pages can finish loading", async () => {
		vi.useFakeTimers();
		try {
			mocks.identity.mockImplementation(() => new Promise(() => {}));
			const pending = getLearningIdentity();
			await vi.advanceTimersByTimeAsync(1500);
			expect(await pending).toEqual({
				userId: null,
				isSignedIn: false,
				unavailable: true,
			});
		} finally {
			vi.useRealTimers();
		}
	});

	it("reports identity failure without making lessons unavailable", async () => {
		mocks.identity.mockRejectedValue(new Error("offline"));
		expect(await getLearningIdentity()).toMatchObject({
			userId: null,
			unavailable: true,
		});
		mocks.identity.mockClear();
		for (const lesson of tradingFlowCourse.lessons) {
			expect(await getLessonPageDataImpl({ slug: lesson.slug })).toMatchObject({
				found: true,
				body: expect.any(String),
				learning: expect.any(Object),
				media: null,
			});
		}
		expect(mocks.identity).not.toHaveBeenCalled();
		expect(mocks.stripe).not.toHaveBeenCalled();
	});
});
