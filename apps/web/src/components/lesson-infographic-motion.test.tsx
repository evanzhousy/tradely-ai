// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonInfographic } from "./lesson-infographic";
import { useLessonInfographicMotion } from "./lesson-infographic-motion";

function Example({
	subject = "example",
	enabled = true,
}: {
	subject?: string;
	enabled?: boolean;
}) {
	const ref = useLessonInfographicMotion(subject, enabled);
	return (
		<a href="/lesson" className="curriculum-card-link" data-testid="card">
			<svg ref={ref} role="img" aria-label="A complete research diagram">
				<text>Question and evidence</text>
				<path d="M0 0L10 10" data-diagram-motion="trace" />
				<circle cx="10" cy="10" r="2" data-diagram-motion="pulse" />
			</svg>
		</a>
	);
}

type TestAnimation = {
	finished: Promise<void>;
	finish: () => void;
	cancel: ReturnType<typeof vi.fn>;
};
let handles: TestAnimation[];
let intersections: IntersectionObserverCallback[];
let disconnect: ReturnType<typeof vi.fn>;
let animate: ReturnType<typeof vi.fn>;
let hidden: boolean;
let reduced: boolean;
let preferenceListeners: Set<() => void>;
const originalAnimate = Object.getOwnPropertyDescriptor(
	Element.prototype,
	"animate",
);

function enter(visible = true) {
	act(() =>
		intersections.at(-1)?.(
			[
				{ isIntersecting: visible, intersectionRatio: visible ? 0.8 : 0 },
			] as IntersectionObserverEntry[],
			{} as IntersectionObserver,
		),
	);
}
function pointer(pointerType = "mouse", element = screen.getByTestId("card")) {
	fireEvent(element, Object.assign(new Event("pointerenter"), { pointerType }));
}
async function finish() {
	await act(async () => {
		for (const handle of handles) handle.finish();
	});
}
function changePreference(value: boolean) {
	act(() => {
		reduced = value;
		for (const listener of preferenceListeners) listener();
	});
}

beforeEach(() => {
	vi.useFakeTimers();
	handles = [];
	intersections = [];
	disconnect = vi.fn();
	preferenceListeners = new Set();
	hidden = false;
	reduced = false;
	vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return reduced;
		},
		addEventListener: (_event: string, listener: () => void) =>
			preferenceListeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			preferenceListeners.delete(listener),
	}));
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(callback: IntersectionObserverCallback) {
				intersections.push(callback);
			}
			observe = vi.fn();
			disconnect = disconnect;
		},
	);
	animate = vi.fn(() => {
		let resolve: () => void = () => {};
		const finished = new Promise<void>((done) => {
			resolve = done;
		});
		const handle = {
			finished,
			finish: () => resolve(),
			cancel: vi.fn(() => resolve()),
		};
		handles.push(handle);
		return handle;
	});
	Object.defineProperty(Element.prototype, "animate", {
		configurable: true,
		writable: true,
		value: animate,
	});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	if (originalAnimate)
		Object.defineProperty(Element.prototype, "animate", originalAnimate);
	else Reflect.deleteProperty(Element.prototype, "animate");
});

async function advance(milliseconds: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(milliseconds);
	});
}

describe("lesson illustration loops", () => {
	it("animates the matching path at 2x and cancels it to the complete static diagram", () => {
		const { container, rerender } = render(
			<LessonInfographic subject="execution-counterparties" locale="en" />,
		);
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		expect(animate.mock.calls[0][0]).toContainEqual({
			transform: "translate(44px, 0px)",
			opacity: 1,
			offset: 0.9,
		});
		expect(animate.mock.calls[1][0]).toContainEqual({
			transform: "translate(-44px, 0px)",
			opacity: 1,
			offset: 0.9,
		});
		expect(animate.mock.calls[0][1]).toMatchObject({
			duration: 1300,
			delay: 0,
		});
		expect(animate.mock.calls[1][1]).toMatchObject({
			duration: 1300,
			delay: 200,
		});
		rerender(
			<LessonInfographic
				subject="execution-counterparties"
				locale="en"
				motionEnabled={false}
			/>,
		);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		expect(container.textContent).toContain("1 print · 2 parties");
	});
	it("grows positive and negative exposure bars from zero in their declared directions", () => {
		render(<LessonInfographic subject="gamma-exposure" locale="en" />);
		enter();
		expect(animate).toHaveBeenCalledTimes(3);
		for (const [frames, options] of animate.mock.calls) {
			expect(frames).toContainEqual({ transform: "scaleY(1)", offset: 0.75 });
			expect(options).toMatchObject({ duration: 1150, iterations: 1 });
		}
		expect(
			document
				.querySelector('[data-diagram-motion="grow-down"]')
				?.getAttribute("y"),
		).toBe("113");
	});
	it("repeats complete sequences with a quiet gap and keeps parallel starts from stacking", async () => {
		render(<Example />);
		expect(animate).not.toHaveBeenCalled();
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		enter();
		pointer();
		expect(animate).toHaveBeenCalledTimes(2);
		for (const call of animate.mock.calls)
			expect(call[1]).toMatchObject({ iterations: 1, fill: "none" });
		await finish();
		expect(screen.getByRole("img").getAttribute("data-motion-state")).toBe(
			"waiting",
		);
		enter();
		pointer();
		await advance(699);
		expect(animate).toHaveBeenCalledTimes(2);
		await advance(1);
		expect(animate).toHaveBeenCalledTimes(4);
		await finish();
		await advance(700);
		expect(animate).toHaveBeenCalledTimes(6);
		expect(screen.getByText("Question and evidence")).toBeTruthy();
	});

	it("cancels active effects offscreen and starts again when the diagram returns", async () => {
		const { unmount } = render(<Example />);
		enter();
		enter(false);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		enter();
		expect(animate).toHaveBeenCalledTimes(4);
		unmount();
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		expect(disconnect).toHaveBeenCalledOnce();
		expect(preferenceListeners.size).toBe(0);
		enter();
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(4);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("clears the scheduled cycle when scrolling away during the rest", async () => {
		render(<Example />);
		enter();
		await finish();
		expect(vi.getTimerCount()).toBe(1);
		enter(false);
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		expect(vi.getTimerCount()).toBe(0);
		expect(screen.getByText("Question and evidence")).toBeTruthy();
	});

	it("honors reduced motion and resumes only after the preference is disabled", async () => {
		reduced = true;
		render(<Example />);
		enter();
		await advance(5000);
		expect(animate).not.toHaveBeenCalled();
		expect(screen.getByRole("img").getAttribute("data-motion-state")).toBe(
			"reduced",
		);
		changePreference(false);
		expect(animate).toHaveBeenCalledTimes(2);
		changePreference(true);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		changePreference(false);
		expect(animate).toHaveBeenCalledTimes(4);
		await finish();
		changePreference(true);
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(4);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("stops active and scheduled loops in hidden tabs, then resumes when visible", async () => {
		render(<Example />);
		enter();
		hidden = true;
		fireEvent(document, new Event("visibilitychange"));
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		hidden = false;
		fireEvent(document, new Event("visibilitychange"));
		expect(animate).toHaveBeenCalledTimes(4);
		await finish();
		hidden = true;
		fireEvent(document, new Event("visibilitychange"));
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(4);
		hidden = false;
		fireEvent(document, new Event("visibilitychange"));
		expect(animate).toHaveBeenCalledTimes(6);
	});

	it("pauses both active effects and pending cycles through the playback control", async () => {
		const { rerender } = render(<Example />);
		enter();
		rerender(<Example enabled={false} />);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		expect(screen.getByRole("img").getAttribute("data-motion-state")).toBe(
			"paused",
		);
		rerender(<Example />);
		enter();
		expect(animate).toHaveBeenCalledTimes(4);
		await finish();
		rerender(<Example enabled={false} />);
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(4);
		expect(vi.getTimerCount()).toBe(0);
		expect(screen.getByText("Question and evidence")).toBeTruthy();
	});

	it("keeps hover, touch, and keyboard navigation from restarting the loop", async () => {
		render(<Example />);
		enter();
		await finish();
		pointer("touch");
		pointer("mouse");
		fireEvent.focus(screen.getByTestId("card"));
		expect(animate).toHaveBeenCalledTimes(2);
		await advance(700);
		expect(animate).toHaveBeenCalledTimes(4);
		expect(screen.getByRole("link").getAttribute("href")).toBe("/lesson");
	});

	it("drops an old subject's pending cycle when the subject changes", async () => {
		const { rerender } = render(<Example />);
		enter();
		await finish();
		rerender(<Example subject="another" />);
		await advance(5000);
		expect(animate).toHaveBeenCalledTimes(2);
		enter();
		expect(animate).toHaveBeenCalledTimes(4);
		expect(animate.mock.calls.at(-1)?.[1].id).toBe("lesson-another");
	});

	it("uses the latest visibility entry when the browser batches intersection changes", () => {
		render(<Example />);
		act(() =>
			intersections[0]?.(
				[
					{ isIntersecting: true, intersectionRatio: 0.8 },
					{ isIntersecting: false, intersectionRatio: 0 },
				] as IntersectionObserverEntry[],
				{} as IntersectionObserver,
			),
		);
		expect(animate).not.toHaveBeenCalled();
	});

	it("retains the full diagram when animation APIs are unavailable", () => {
		Reflect.deleteProperty(Element.prototype, "animate");
		render(<Example />);
		expect(screen.getByRole("img")).toBeTruthy();
		expect(screen.getByText("Question and evidence")).toBeTruthy();
		expect(intersections).toHaveLength(0);
		expect(vi.getTimerCount()).toBe(0);
	});
});
