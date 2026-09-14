import { animate } from "motion/mini";
import { useEffect, useRef } from "react";

const ease = [0.23, 1, 0.32, 1] as const;
const navigationKeys = new Set([
	"Tab",
	"ArrowDown",
	"ArrowUp",
	"PageDown",
	"PageUp",
	"Home",
	"End",
	" ",
]);

/** Owns homepage decoration; content is visible before JS and never waits for motion. */
export function useLandingMotion() {
	const ref = useRef<HTMLElement>(null);
	useEffect(() => {
		const root = ref.current;
		if (!root || typeof window.matchMedia !== "function") return;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
		const active = new Map<HTMLElement, ReturnType<typeof animate>>();
		const seen = new Set<Element>();
		let disposed = false;
		let keyboardNavigation = false;

		const settle = (element: HTMLElement) => {
			active.get(element)?.cancel();
			active.delete(element);
			element.style.removeProperty("opacity");
			element.style.removeProperty("translate");
		};
		const settleAll = () => {
			for (const element of active.keys()) settle(element);
		};
		const observer =
			typeof IntersectionObserver !== "undefined" &&
			typeof root.animate === "function"
				? new IntersectionObserver(
						(entries) => {
							let order = 0;
							for (const entry of entries) {
								if (disposed || !entry.isIntersecting || seen.has(entry.target))
									continue;
								const element = entry.target as HTMLElement;
								seen.add(element);
								observer?.unobserve(element);
								if (
									keyboardNavigation ||
									document.hidden ||
									element.contains(document.activeElement)
								)
									continue;
								const animation = animate(
									element,
									{
										opacity: [reduced.matches ? 0.85 : 0, 1],
										// Individual translate preserves the cards' existing hover transforms.
										...(reduced.matches
											? {}
											: { translate: ["0 16px", "0 0"] }),
									},
									{
										duration: reduced.matches ? 0.12 : 0.4,
										delay: reduced.matches ? 0 : Math.min(order++, 2) * 0.06,
										ease,
									},
								);
								active.set(element, animation);
								void animation.then(() => {
									if (active.get(element) === animation) settle(element);
								});
							}
						},
						{ threshold: 0.08 },
					)
				: undefined;
		for (const group of root.querySelectorAll<HTMLElement>(
			"[data-landing-reveal]",
		)) {
			for (const element of group.querySelectorAll(
				group.dataset.landingReveal || ":scope > *",
			)) {
				observer?.observe(element);
			}
		}

		const book = root.querySelector<HTMLElement>(".landing-field-guide");
		const surface = book?.querySelector<HTMLElement>(".landing-book-surface");
		const resetBook = () => {
			surface?.style.removeProperty("--book-tilt-x");
			surface?.style.removeProperty("--book-tilt-y");
			surface?.style.removeProperty("--book-scale");
		};
		const tiltBook = (event: PointerEvent) => {
			if (
				!book ||
				!surface ||
				reduced.matches ||
				!pointer.matches ||
				event.pointerType !== "mouse"
			) {
				resetBook();
				return;
			}
			const rect = book.getBoundingClientRect();
			const normalize = (position: number, start: number, size: number) =>
				Math.max(-1, Math.min(1, ((position - start) / size) * 2 - 1));
			surface.style.setProperty(
				"--book-tilt-x",
				`${-normalize(event.clientY, rect.top, rect.height) * 3}deg`,
			);
			surface.style.setProperty(
				"--book-tilt-y",
				`${normalize(event.clientX, rect.left, rect.width) * 3}deg`,
			);
			surface.style.setProperty("--book-scale", "1.01");
		};
		const onPreferenceChange = () => {
			settleAll();
			resetBook();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (!navigationKeys.has(event.key)) return;
			keyboardNavigation = true;
			observer?.disconnect();
			onPreferenceChange();
		};
		const onVisibilityChange = () => {
			if (document.hidden) onPreferenceChange();
		};
		book?.addEventListener("pointermove", tiltBook);
		book?.addEventListener("pointerleave", resetBook);
		book?.addEventListener("pointercancel", resetBook);
		root.addEventListener("focusin", settleAll);
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("visibilitychange", onVisibilityChange);
		reduced.addEventListener("change", onPreferenceChange);
		pointer.addEventListener("change", onPreferenceChange);
		return () => {
			disposed = true;
			observer?.disconnect();
			onPreferenceChange();
			book?.removeEventListener("pointermove", tiltBook);
			book?.removeEventListener("pointerleave", resetBook);
			book?.removeEventListener("pointercancel", resetBook);
			root.removeEventListener("focusin", settleAll);
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			reduced.removeEventListener("change", onPreferenceChange);
			pointer.removeEventListener("change", onPreferenceChange);
		};
	}, []);
	return ref;
}
