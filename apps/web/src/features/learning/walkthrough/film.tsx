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
 * in a drawing `width` wide; `Head` holds the on-canvas text for each shot; `build` makes
 * the one paused timeline that moves them all, with a label at the start of every shot.
 * The drawing is laid out at the width it gets, so text keeps its true size on a phone.
 */
export type Film = {
	id: string;
	label: Copy;
	shots: readonly [FilmShot, ...FilmShot[]];
	height: (width: number) => number;
	Head: ComponentType<{ locale: Locale }>;
	Scene: ComponentType<{ width: number; height: number; locale: Locale }>;
	build: (context: FilmContext) => gsap.core.Timeline;
};

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
	}, [film, locale, width]);
	const { Head, Scene } = film;
	const height = width === null ? 0 : film.height(width);
	return (
		<div ref={stage} className="wt-film" data-film={film.id}>
			{width === null ? null : (
				<>
					<div className="wt-film-head">
						<Head locale={locale} />
					</div>
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
					</svg>
				</>
			)}
		</div>
	);
}
