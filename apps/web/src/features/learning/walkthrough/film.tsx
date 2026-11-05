import { gsap } from "gsap";
import {
	type ComponentType,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";

export type FilmShot = { id: string; label: Copy };

/** What a film's build gets: its stage, its drawing and the size they were drawn at. */
export type FilmContext = {
	stage: HTMLDivElement;
	svg: SVGSVGElement;
	width: number;
	height: number;
	locale: Locale;
};

/**
 * A lesson's motion graphic. `Scene` draws every mark the film will ever show, at rest,
 * in a frame `width` wide and `height(width)` tall; `build` makes the one paused timeline
 * that moves them all, with a label at the start of every shot. The frame is laid out at
 * the width it gets, so text keeps its true size on a phone. A "dark" stage brings its
 * own colours, whatever the page's theme: it reads as a video embedded in the page.
 */
export type Film = {
	id: string;
	label: Copy;
	stage?: "dark";
	shots: readonly [FilmShot, ...FilmShot[]];
	height: (width: number) => number;
	Scene: ComponentType<{ width: number; height: number; locale: Locale }>;
	build: (context: FilmContext) => gsap.core.Timeline;
};

/** How much text can be read on the stage: each text's length by how visible it is. */
function readableText(svg: SVGSVGElement) {
	let total = 0;
	for (const text of svg.querySelectorAll("text")) {
		const { length } = text.textContent.trim();
		if (!length) continue;
		let alpha = 1;
		for (
			let element: Element | null = text;
			element && element !== svg;
			element = element.parentElement
		)
			alpha *= Number(getComputedStyle(element).opacity);
		// A flip folds its marks to scale 0 at full opacity.
		const matrix = text.getCTM();
		if (matrix && Math.hypot(matrix.c, matrix.d) < 0.02) alpha = 0;
		total += length * alpha;
	}
	return total;
}

/** How far before a shot's end a fade out can start. Exits take 0.35 s; some are staggered. */
const STILL_OFFSETS = [0.01, 0.15, 0.3, 0.45, 0.6, 0.8, 1, 1.2];

/**
 * The frame a film stands on when it stops at the end of a shot. Many shots fade out before
 * the next label, so their very last frame is close to empty: this is the latest frame near
 * the end with the stage still full. The timeline is back where it was on return.
 */
export function shotStill(
	timeline: gsap.core.Timeline,
	svg: SVGSVGElement,
	start: number,
	end: number,
) {
	const now = timeline.time();
	const times = STILL_OFFSETS.map((back) => end - back).filter(
		(time) => time > start,
	);
	const amounts = times.map((time) => {
		timeline.seek(time, true);
		return readableText(svg);
	});
	timeline.seek(now, true);
	const fullest = Math.max(...amounts);
	return (
		times[amounts.findIndex((amount) => amount >= fullest * 0.98)] ?? end - 0.01
	);
}

const stageWidth = (element: HTMLElement) => {
	const next = Math.round(element.clientWidth);
	return next > 0 ? Math.max(280, Math.min(next, 820)) : null;
};

/**
 * Draws a film at the width of its column and hands its timeline to the player. A new
 * width redraws the scene and rebuilds the timeline; the player seeks it back to where
 * it was.
 */
export function FilmStage({
	film,
	locale,
	onTimeline,
}: {
	film: Film;
	locale: Locale;
	onTimeline: (timeline: gsap.core.Timeline | null) => void;
}) {
	const stage = useRef<HTMLDivElement>(null);
	const svg = useRef<SVGSVGElement>(null);
	const [width, setWidth] = useState<number | null>(null);
	// Carries, locks and the title wipe measure real glyphs when the timeline is built. On a
	// first visit the web fonts may arrive after that: build once more when they do.
	const [fonts, setFonts] = useState(
		() =>
			typeof document === "undefined" || document.fonts?.status !== "loading",
	);
	useEffect(() => {
		if (fonts || !document.fonts) return;
		let live = true;
		document.fonts.ready.then(() => {
			if (live) setFonts(true);
		});
		return () => {
			live = false;
		};
	}, [fonts]);
	const latest = useRef(onTimeline);
	useEffect(() => {
		latest.current = onTimeline;
	});
	useLayoutEffect(() => {
		const element = stage.current;
		if (!element) return;
		const measure = () => {
			const next = stageWidth(element);
			if (next !== null) setWidth(next);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: `fonts` rebuilds the timeline once the web fonts are in; the player seeks back as after a resize.
	useLayoutEffect(() => {
		const stageElement = stage.current;
		const svgElement = svg.current;
		if (width === null || !stageElement || !svgElement) return;
		const context = gsap.context(() => {
			latest.current(
				film.build({
					stage: stageElement,
					svg: svgElement,
					width,
					height: film.height(width),
					locale,
				}),
			);
		}, stageElement);
		return () => {
			latest.current(null);
			context.revert();
		};
	}, [film, locale, width, fonts]);
	const { Scene } = film;
	const height = width === null ? 0 : film.height(width);
	return (
		<div className="wt-film-frame">
			<div
				ref={stage}
				className="wt-film"
				data-film={film.id}
				data-stage={film.stage}
				style={{
					aspectRatio: width === null ? undefined : `${width} / ${height}`,
				}}
			>
				{width === null ? null : (
					<svg
						ref={svg}
						className="wt-svg wt-film-svg"
						viewBox={`0 0 ${width} ${height}`}
						width={width}
						height={height}
						role="img"
						aria-label={pick(film.label, locale)}
					>
						<Scene
							key={`${width}:${locale}`}
							width={width}
							height={height}
							locale={locale}
						/>
						{/* Above everything the Scene draws: what `director.carry` flies. */}
						<g key={`carry:${width}:${locale}`} data-f="carry-layer" />
					</svg>
				)}
			</div>
		</div>
	);
}
