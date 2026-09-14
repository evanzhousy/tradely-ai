// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLandingMotion } from "./landing-motion";

const { animate } = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock("motion/mini", () => ({ animate }));

function Example() {
	const ref = useLandingMotion();
	return (
		<main ref={ref}>
			<div className="landing-field-guide" data-testid="book">
				<div className="landing-book-surface" data-testid="surface">
					Field guide
				</div>
			</div>
			<ol data-landing-reveal=":scope > li">
				<li>
					<a href="/first">First lesson</a>
				</li>
				<li>
					<a href="/second">Second lesson</a>
				</li>
			</ol>
		</main>
	);
}

let callback: IntersectionObserverCallback;
let observed: Element[];
let disconnect: ReturnType<typeof vi.fn>;
let reduced: boolean;
let fine: boolean;
let listeners: Set<() => void>;
let handles: { cancel: ReturnType<typeof vi.fn>; finish: () => void }[];

function enter() {
	act(() =>
		callback(
			observed.map((target) => ({
				target,
				isIntersecting: true,
			})) as IntersectionObserverEntry[],
			{} as IntersectionObserver,
		),
	);
}

function moveBook(pointerType = "mouse") {
	fireEvent(
		screen.getByTestId("book"),
		Object.assign(new Event("pointermove"), {
			pointerType,
			clientX: 190,
			clientY: 20,
		}),
	);
}

function changePreference() {
	act(() => {
		for (const listener of listeners) listener();
	});
}

beforeEach(() => {
	observed = [];
	handles = [];
	listeners = new Set();
	reduced = false;
	fine = true;
	disconnect = vi.fn();
	vi.stubGlobal("matchMedia", (query: string) => ({
		get matches() {
			return query.includes("reduced-motion") ? reduced : fine;
		},
		addEventListener: (_event: string, listener: () => void) =>
			listeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			listeners.delete(listener),
	}));
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(cb: IntersectionObserverCallback) {
				callback = cb;
			}
			observe(element: Element) {
				observed.push(element);
			}
			unobserve = vi.fn();
			disconnect = disconnect;
		},
	);
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		width: 200,
		height: 300,
		right: 200,
		bottom: 300,
		toJSON() {},
	});
	Object.defineProperty(HTMLElement.prototype, "animate", {
		configurable: true,
		value: vi.fn(),
	});
	animate.mockImplementation(
		(element: HTMLElement, frames: { opacity: number[] }) => {
			element.style.opacity = String(frames.opacity[0]);
			let finish = () => {};
			const promise = new Promise<void>((resolve) => {
				finish = resolve;
			});
			const handle = { cancel: vi.fn(), finish };
			handles.push(handle);
			return Object.assign(promise, { cancel: handle.cancel });
		},
	);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	animate.mockReset();
	Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

describe("landing motion", () => {
	it("renders readable links on the server and without animation APIs", () => {
		const html = renderToString(<Example />);
		expect(html).toContain('href="/first"');
		expect(html).not.toMatch(/opacity|visibility|inert/);
		vi.stubGlobal("IntersectionObserver", undefined);
		render(<Example />);
		expect(
			screen.getByRole("link", { name: "First lesson" }).closest("li")?.style
				.opacity,
		).toBe("");
		expect(animate).not.toHaveBeenCalled();
	});

	it("reveals each card once and restores styles so hover behavior remains available", async () => {
		render(<Example />);
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		expect(animate.mock.calls[0]?.[2]).toMatchObject({
			duration: 0.4,
			delay: 0,
		});
		expect(animate.mock.calls[1]?.[2]).toMatchObject({ delay: 0.06 });
		expect(animate.mock.calls[0]?.[1]).toMatchObject({
			translate: ["0 16px", "0 0"],
		});
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
		await act(async () => {
			for (const handle of handles) handle.finish();
		});
		expect(
			observed.every((element) => !(element as HTMLElement).style.opacity),
		).toBe(true);
	});

	it("settles immediately when a link receives focus", () => {
		render(<Example />);
		enter();
		fireEvent.focusIn(screen.getByRole("link", { name: "First lesson" }));
		expect(
			handles.every((handle) => handle.cancel.mock.calls.length === 1),
		).toBe(true);
		expect(
			observed.every((element) => !(element as HTMLElement).style.opacity),
		).toBe(true);
	});

	it("keeps keyboard navigation immediate, including before cards enter", () => {
		render(<Example />);
		fireEvent.keyDown(document, { key: "Tab" });
		enter();
		expect(disconnect).toHaveBeenCalled();
		expect(animate).not.toHaveBeenCalled();
	});

	it("uses a short opacity-only reveal for reduced motion", () => {
		reduced = true;
		render(<Example />);
		enter();
		expect(animate.mock.calls[0]?.[1]).toEqual({ opacity: [0.85, 1] });
		expect(animate.mock.calls[0]?.[2]).toMatchObject({
			duration: 0.12,
			delay: 0,
		});
		moveBook();
		expect(screen.getByTestId("surface").style.length).toBe(0);
	});

	it("resets active entrances and tilt when motion preference changes", () => {
		render(<Example />);
		enter();
		moveBook();
		expect(
			screen.getByTestId("surface").style.getPropertyValue("--book-scale"),
		).toBe("1.01");
		reduced = true;
		changePreference();
		expect(
			handles.every((handle) => handle.cancel.mock.calls.length === 1),
		).toBe(true);
		expect(screen.getByTestId("surface").style.length).toBe(0);
		moveBook();
		expect(screen.getByTestId("surface").style.length).toBe(0);
	});

	it("limits tilt to fine mouse input and resets on pointer leave or capability changes", () => {
		render(<Example />);
		moveBook("touch");
		expect(screen.getByTestId("surface").style.length).toBe(0);
		moveBook();
		const surface = screen.getByTestId("surface");
		expect(
			Number.parseFloat(surface.style.getPropertyValue("--book-tilt-x")),
		).toBeLessThanOrEqual(3);
		fireEvent.pointerLeave(screen.getByTestId("book"));
		expect(surface.style.length).toBe(0);
		moveBook();
		fine = false;
		changePreference();
		moveBook();
		expect(surface.style.length).toBe(0);
	});

	it("cancels active effects and removes observers and listeners on unmount", () => {
		const { unmount } = render(<Example />);
		enter();
		unmount();
		expect(
			handles.every((handle) => handle.cancel.mock.calls.length === 1),
		).toBe(true);
		expect(disconnect).toHaveBeenCalled();
		expect(listeners.size).toBe(0);
		enter();
		expect(animate).toHaveBeenCalledTimes(2);
	});
});
