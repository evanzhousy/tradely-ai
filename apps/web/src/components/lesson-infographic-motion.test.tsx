// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLessonInfographicMotion } from "./lesson-infographic-motion";

function Example({ subject = "example" }: { subject?: string }) {
	const ref = useLessonInfographicMotion(subject);
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
let fine: boolean;
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
	handles = [];
	intersections = [];
	disconnect = vi.fn();
	preferenceListeners = new Set();
	hidden = false;
	reduced = false;
	fine = true;
	vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
	vi.stubGlobal("matchMedia", (query: string) => ({
		get matches() {
			return query.includes("reduced-motion") ? reduced : fine;
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
	if (originalAnimate)
		Object.defineProperty(Element.prototype, "animate", originalAnimate);
	else Reflect.deleteProperty(Element.prototype, "animate");
});

describe("lesson illustration playback", () => {
	it("plays once on entry and replays on mouse hover without restarting a running sequence", async () => {
		render(<Example />);
		expect(animate).not.toHaveBeenCalled();
		expect(screen.getByText("Question and evidence")).toBeTruthy();
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		pointer();
		expect(animate).toHaveBeenCalledTimes(2);
		for (const call of animate.mock.calls)
			expect(call[1]).toMatchObject({ iterations: 1, fill: "none" });
		await finish();
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		pointer();
		expect(animate).toHaveBeenCalledTimes(4);
		expect(screen.getByRole("img").getAttribute("data-motion-state")).toBe(
			"playing",
		);
	});

	it("cancels offscreen work, preserves the static diagram, and releases listeners on unmount", () => {
		const { unmount } = render(<Example />);
		enter();
		enter(false);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		expect(screen.getByText("Question and evidence")).toBeTruthy();
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		pointer();
		const trigger = screen.getByTestId("card");
		unmount();
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		expect(disconnect).toHaveBeenCalledOnce();
		expect(preferenceListeners.size).toBe(0);
		pointer("mouse", trigger);
		expect(animate).toHaveBeenCalledTimes(4);
	});

	it("honors reduced motion initially and when the preference changes during playback", () => {
		reduced = true;
		render(<Example />);
		enter();
		pointer();
		expect(animate).not.toHaveBeenCalled();
		expect(screen.getByRole("img").getAttribute("data-motion-state")).toBe(
			"reduced",
		);
		changePreference(false);
		expect(animate).toHaveBeenCalledTimes(2);
		changePreference(true);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		pointer();
		expect(animate).toHaveBeenCalledTimes(2);
		expect(screen.getByText("Question and evidence")).toBeTruthy();
	});

	it("stops when the document is hidden and does not run an automatic loop on return", () => {
		render(<Example />);
		enter();
		hidden = true;
		fireEvent(document, new Event("visibilitychange"));
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		hidden = false;
		fireEvent(document, new Event("visibilitychange"));
		expect(animate).toHaveBeenCalledTimes(2);
		pointer();
		expect(animate).toHaveBeenCalledTimes(4);
	});

	it("keeps touch and keyboard navigation immediate, while touch still gets the first-view animation", async () => {
		render(<Example />);
		enter();
		await finish();
		pointer("touch");
		fireEvent.focus(screen.getByTestId("card"));
		expect(animate).toHaveBeenCalledTimes(2);
		fine = false;
		pointer();
		expect(animate).toHaveBeenCalledTimes(2);
		expect(screen.getByRole("link").getAttribute("href")).toBe("/lesson");
	});

	it("resets first-view playback when the subject changes", () => {
		const { rerender } = render(<Example />);
		enter();
		rerender(<Example subject="another" />);
		for (const handle of handles) expect(handle.cancel).toHaveBeenCalledOnce();
		enter();
		expect(animate).toHaveBeenCalledTimes(4);
	});

	it("retains the full diagram when animation APIs are unavailable", () => {
		Reflect.deleteProperty(Element.prototype, "animate");
		render(<Example />);
		expect(screen.getByRole("img")).toBeTruthy();
		expect(screen.getByText("Question and evidence")).toBeTruthy();
		expect(intersections).toHaveLength(0);
	});
});
