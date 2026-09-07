// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { contractNeighborhoodScenarios } from "@/content/scenarios/contract-neighborhood";
import { useContractReplay } from "./use-contract-replay";

describe("replay transport", () => {
	const data = contractNeighborhoodScenarios[0].steps[0].neighborhood;
	if (!data) throw new Error("Missing replay");
	let now = 0;
	let nextId = 0;
	let hidden = false;
	let reduce = false;
	let mediaListener: () => void = () => {};
	let intersectionListener: IntersectionObserverCallback = () => {};
	const callbacks = new Map<number, FrameRequestCallback>();
	const host = { current: document.createElement("section") };
	beforeEach(() => {
		now = 0;
		nextId = 0;
		hidden = false;
		reduce = false;
		callbacks.clear();
		vi.spyOn(performance, "now").mockImplementation(() => now);
		vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
			callbacks.set(++nextId, callback);
			return nextId;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
		vi.stubGlobal("matchMedia", () => ({
			get matches() {
				return reduce;
			},
			addEventListener: (_name: string, callback: () => void) => {
				mediaListener = callback;
			},
			removeEventListener: vi.fn(),
		}));
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				constructor(callback: IntersectionObserverCallback) {
					intersectionListener = callback;
				}
				observe() {
					intersectionListener(
						[{ isIntersecting: true } as IntersectionObserverEntry],
						this as unknown as IntersectionObserver,
					);
				}
				disconnect() {}
			},
		);
	});
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	const advance = (milliseconds: number) =>
		act(() => {
			now += milliseconds;
			const batch = [...callbacks.values()];
			callbacks.clear();
			for (const callback of batch) callback(now);
		});
	it("plays, pauses, resumes, changes speed and stops at the close", () => {
		const { result } = renderHook(() => useContractReplay(data, host));
		expect(result.current.clock.rate).toBe(2);
		act(() => result.current.play());
		advance(1750);
		expect(result.current.position).toBe(0.25);
		act(() => result.current.pause());
		advance(5000);
		expect(result.current.position).toBe(0.25);
		expect(callbacks.size).toBe(0);
		act(() => result.current.play());
		advance(1750);
		expect(result.current.position).toBe(0.5);
		act(() => result.current.setRate(1));
		expect(result.current.position).toBe(0.5);
		advance(7000);
		expect(result.current.position).toBe(1);
		expect(result.current.clock.playing).toBe(false);
		expect(callbacks.size).toBe(0);
	});
	it("scrubbing interrupts playback and unmount cancels scheduled work", () => {
		const { result, unmount } = renderHook(() => useContractReplay(data, host));
		act(() => result.current.play());
		advance(1000);
		act(() => result.current.seek(0.7));
		expect(result.current.position).toBe(0.7);
		expect(result.current.clock.playing).toBe(false);
		expect(callbacks.size).toBe(0);
		act(() => result.current.play());
		unmount();
		expect(callbacks.size).toBe(0);
	});
	it("pauses when hidden or offscreen and does not skip forward on return", () => {
		const { result } = renderHook(() => useContractReplay(data, host));
		act(() => result.current.play());
		advance(700);
		act(() => {
			hidden = true;
			document.dispatchEvent(new Event("visibilitychange"));
		});
		expect(result.current.clock.playing).toBe(false);
		advance(20000);
		act(() => {
			hidden = false;
			document.dispatchEvent(new Event("visibilitychange"));
		});
		expect(result.current.position).toBeCloseTo(0.1);
		act(() => result.current.play());
		advance(700);
		act(() =>
			intersectionListener(
				[{ isIntersecting: false } as IntersectionObserverEntry],
				{} as IntersectionObserver,
			),
		);
		expect(result.current.clock.playing).toBe(false);
		expect(result.current.position).toBeCloseTo(0.2);
	});
	it("reduced-motion preference starts at the closing snapshot and offers stepped playback", () => {
		reduce = true;
		const { result } = renderHook(() => useContractReplay(data, host, 0));
		expect(result.current.position).toBe(1);
		expect(result.current.reducedMotion).toBe(true);
		act(() => result.current.play());
		advance(1500);
		expect(result.current.clock.stepOnly).toBe(true);
		expect(result.current.position).toBeCloseTo(60 / 390);
		act(() => mediaListener());
		expect(result.current.clock.playing).toBe(true);
	});
	it("pauses normal motion when reduced motion is enabled, then allows explicit stepped playback", () => {
		const { result } = renderHook(() => useContractReplay(data, host));
		act(() => result.current.play());
		advance(700);
		act(() => {
			reduce = true;
			mediaListener();
		});
		expect(result.current.clock.playing).toBe(false);
		expect(result.current.position).toBeCloseTo(0.1);
		act(() => result.current.play());
		expect(result.current.clock.stepOnly).toBe(true);
		act(() => mediaListener());
		expect(result.current.clock.playing).toBe(true);
	});
});
