import { describe, expect, it } from "vitest";
import type { GuestWork } from "@/domain/guest-learning";
import {
	clearGuestHandoff,
	GUEST_HANDOFF_TTL,
	guestPromptWasShown,
	markGuestPromptShown,
	prepareGuestHandoff,
	readGuestHandoff,
	writeGuestHandoff,
} from "./guest-handoff";

class Store {
	map = new Map<string, string>();
	getItem(k: string) {
		return this.map.get(k) ?? null;
	}
	setItem(k: string, v: string) {
		this.map.set(k, v);
	}
	removeItem(k: string) {
		this.map.delete(k);
	}
}
const work: GuestWork = {
	lessonId: "rank-symbols",
	scenarioId: "rank-symbols-practice-1",
	scenarioVersion: 2,
	contentVersion: 2,
	variant: 0,
	actions: [],
	intent: "place",
};
describe("explicit guest save handoff", () => {
	it("round trips work and reuses one transfer only for the same snapshot", () => {
		const store = new Store();
		const first = prepareGuestHandoff(work, store, 100);
		expect(readGuestHandoff(work.lessonId, store, 101)).toEqual({
			status: "ready",
			handoff: first,
		});
		expect(prepareGuestHandoff(work, store, 101).transferId).toBe(
			first.transferId,
		);
		expect(
			prepareGuestHandoff(
				{ ...work, actions: [{ type: "continue" }] },
				store,
				102,
			).transferId,
		).not.toBe(first.transferId);
	});
	it("retains account binding during authentication retries", () => {
		const store = new Store();
		const first = prepareGuestHandoff(work, store, 100);
		writeGuestHandoff({ ...first, boundUserId: "account-a" }, store);
		expect(prepareGuestHandoff(work, store, 101).boundUserId).toBe("account-a");
	});
	it("expires after 24 hours and isolates different lessons", () => {
		const store = new Store();
		prepareGuestHandoff(work, store, 100);
		expect(readGuestHandoff("another-lesson", store, 101).status).toBe(
			"missing",
		);
		expect(
			readGuestHandoff(work.lessonId, store, 100 + GUEST_HANDOFF_TTL).status,
		).toBe("expired");
		expect(
			readGuestHandoff(work.lessonId, store, 100 + GUEST_HANDOFF_TTL).status,
		).toBe("missing");
	});
	it("clears only the acknowledged transfer, preserving a newer pending save", () => {
		const store = new Store();
		const first = prepareGuestHandoff(work, store);
		const next = prepareGuestHandoff({ ...work, intent: "research" }, store);
		clearGuestHandoff(work.lessonId, first.transferId, store);
		expect(readGuestHandoff(work.lessonId, store).status).toBe("ready");
		clearGuestHandoff(work.lessonId, next.transferId, store);
		expect(readGuestHandoff(work.lessonId, store).status).toBe("missing");
	});
	it("rejects broken, mismatched, future-dated and oversized storage without logging its contents", () => {
		const store = new Store();
		const first = prepareGuestHandoff(work, store, 100);
		const key = [...store.map.keys()][0];
		store.setItem(key, "not-json");
		expect(readGuestHandoff(work.lessonId, store, 101).status).toBe(
			"unavailable",
		);
		store.setItem(
			key,
			JSON.stringify({ ...first, work: { ...work, lessonId: "another" } }),
		);
		expect(readGuestHandoff(work.lessonId, store, 101).status).toBe("invalid");
		writeGuestHandoff(first, store);
		expect(readGuestHandoff(work.lessonId, store, 99).status).toBe("expired");
		store.setItem(key, "x".repeat(2 * 1024 * 1024 + 1));
		expect(readGuestHandoff(work.lessonId, store, 101).status).toBe("invalid");
	});
	it("stops saving when browser storage throws or silently drops writes", () => {
		const denied = {
			getItem: () => null,
			setItem: () => {
				throw new Error("denied");
			},
			removeItem: () => {},
		};
		expect(() => prepareGuestHandoff(work, denied)).toThrow();
		expect(() =>
			prepareGuestHandoff(work, { ...denied, setItem: () => {} }),
		).toThrow(/unavailable/);
	});
	it("remembers dismissal without storing any learner data", () => {
		const store = new Store();
		expect(guestPromptWasShown(store)).toBe(false);
		markGuestPromptShown(store);
		expect(guestPromptWasShown(store)).toBe(true);
		expect([...store.map.values()]).toEqual(["1"]);
	});
});
