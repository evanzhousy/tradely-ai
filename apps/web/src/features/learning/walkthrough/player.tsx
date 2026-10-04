import { Button, buttonVariants } from "@tradely/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import {
	ArrowDownIcon,
	ArrowRightIcon,
	CheckIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
} from "lucide-react";
import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useAnalytics } from "@/analytics/context";
import type { VisualLessonPlaybackMode } from "@/analytics/events";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import {
	initializeVisualBookmark,
	markVisualBookmarkEngaged,
	saveVisualBookmark,
} from "../visual-bookmark";
import { VisualLessonIdentity } from "../visual-lesson-identity";
import { TaskPanel } from "./explore-task";
import { type Film, FilmStage } from "./film";
import { usePrefersReducedMotion } from "./stage";
import type { ExploreTask, WalkthroughScene } from "./types";
import { FrameContext, copy as walkthroughCopy } from "./walkthrough";

const RATES = [1, 1.5, 2] as const;
type Rate = (typeof RATES)[number];
const rateKey = "tradely:player-rate:v1";
/** Films play at 2× until a learner picks another speed. */
const DEFAULT_RATE: Rate = 2;
const isRate = (value: number): value is Rate =>
	(RATES as readonly number[]).includes(value);
function readRate(): Rate {
	try {
		const stored = Number(localStorage.getItem(rateKey));
		return isRate(stored) ? stored : DEFAULT_RATE;
	} catch {
		return DEFAULT_RATE;
	}
}
function writeRate(rate: Rate) {
	try {
		localStorage.setItem(rateKey, String(rate));
	} catch {
		/* Storage is optional. */
	}
}

type Mode = "watch" | "play";

const copy = {
	modes: ["Lesson views", "课程视图"],
	watch: ["Watch", "观看"],
	playground: ["Playground", "探索区"],
	timeline: ["Film timeline", "影片时间轴"],
	shot: ["Shot", "镜头"],
	speed: ["Speed", "速度"],
	openPlayground: ["Try the playground", "进入探索区"],
	replay: ["Replay", "重播"],
	challenges: ["Challenges", "挑战"],
	allDone: ["Every challenge done", "所有挑战已完成"],
	allDoneNote: [
		"Now check yourself on a new case.",
		"现在用一个新案例检验自己。",
	],
	ended: ["That's the whole idea", "这就是全部要点"],
	endedNote: [
		"Now try it: the playground sets one challenge per scene.",
		"现在自己试试：探索区每个场景有一个挑战。",
	],
} as const satisfies Record<string, Copy>;

/**
 * Plays a lesson's film, then opens its playground. The film runs by itself once it is on
 * screen, pauses off screen or in a hidden tab, and is scrubbed by shot. With reduced
 * motion it steps from the end of one shot to the next instead of moving between them.
 */
export function Player({
	locale,
	id,
	label,
	film,
	scenes,
}: {
	locale: Locale;
	id: string;
	label: Copy;
	film: Film;
	scenes: readonly [WalkthroughScene, ...WalkthroughScene[]];
}) {
	const t = (value: Copy) => pick(value, locale);
	const wc = walkthroughCopy;
	const lessonId = useContext(VisualLessonIdentity);
	const { capture, isCapturing } = useAnalytics();
	const reduced = usePrefersReducedMotion();
	const root = useRef<HTMLElement>(null);
	const fill = useRef<HTMLSpanElement>(null);
	const headingId = useId();
	const timeline = useRef<gsap.core.Timeline | null>(null);
	/** Film time, kept across rebuilds so a resize doesn't restart the film. */
	const time = useRef(0);
	const shotRef = useRef(0);
	const rateRef = useRef<Rate>(DEFAULT_RATE);
	const [ready, setReady] = useState(0);
	const [shot, setShot] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [ended, setEnded] = useState(false);
	const [visible, setVisible] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [rate, setRate] = useState<Rate>(DEFAULT_RATE);
	const [mode, setMode] = useState<Mode>("watch");
	const [playScene, setPlayScene] = useState(0);
	const [explore, setExplore] = useState<unknown>(null);
	const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
	const started = useRef(new Set<string>());
	const finished = useRef(new Set<string>());
	const explored = useRef(new Set<string>());
	const focusNext = useRef<"heading" | "play" | null>(null);
	const shots = film.shots;
	const last = shots.length - 1;
	/** Scenes the learner can drive. */
	const playable = useMemo(
		() => scenes.flatMap((item, index) => (item.explore ? [index] : [])),
		[scenes],
	);
	const active = mode === "watch" && playing && visible && !hidden && !ended;

	useEffect(() => {
		const stored = readRate();
		rateRef.current = stored;
		setRate(stored);
		if (lessonId) initializeVisualBookmark(lessonId, shots[0].id);
	}, [lessonId, shots]);

	const record = useCallback(
		(
			event:
				| "visual_lesson_scene_started"
				| "visual_lesson_scene_completed"
				| "visual_lesson_explored",
			sceneId: string,
			how?: VisualLessonPlaybackMode,
		) => {
			if (!lessonId) return;
			const seen =
				event === "visual_lesson_scene_started"
					? started
					: event === "visual_lesson_scene_completed"
						? finished
						: explored;
			if (seen.current.has(sceneId)) return;
			seen.current.add(sceneId);
			if (event === "visual_lesson_scene_started")
				markVisualBookmarkEngaged(lessonId, sceneId);
			if (!isCapturing) return;
			const base = { lesson_id: lessonId, scene_id: sceneId, locale };
			if (event === "visual_lesson_explored") capture(event, base);
			else capture(event, { ...base, mode: how ?? "manual" });
		},
		[capture, isCapturing, lessonId, locale],
	);

	/** The start and end of a shot on the timeline. */
	const bounds = useCallback(
		(tl: gsap.core.Timeline, index: number) => {
			const at = (i: number) => tl.labels[shots[i].id] ?? 0;
			return {
				start: at(index),
				end: index < last ? at(index + 1) : tl.duration(),
			};
		},
		[last, shots],
	);

	const paint = useCallback(
		(tl: gsap.core.Timeline, now: number) => {
			let index = 0;
			for (let i = 0; i <= last; i++)
				if (now >= (tl.labels[shots[i].id] ?? 0) - 0.001) index = i;
			if (index !== shotRef.current) {
				shotRef.current = index;
				setShot(index);
				record("visual_lesson_scene_started", shots[index].id, "autoplay");
			}
			const { start, end } = bounds(tl, index);
			const done = end > start ? (now - start) / (end - start) : 1;
			if (fill.current)
				fill.current.style.transform = `scaleX(${Math.max(0, Math.min(1, done))})`;
		},
		[bounds, last, record, shots],
	);

	const onTimeline = useCallback(
		(tl: gsap.core.Timeline | null) => {
			timeline.current = tl;
			if (!tl) return;
			tl.timeScale(rateRef.current);
			tl.seek(Math.min(time.current, tl.duration()), false);
			tl.eventCallback("onUpdate", () => {
				time.current = tl.time();
				paint(tl, tl.time());
			});
			tl.eventCallback("onComplete", () => {
				record("visual_lesson_scene_completed", shots[last].id, "autoplay");
				setEnded(true);
				setPlaying(false);
			});
			paint(tl, tl.time());
			if (import.meta.env.DEV)
				(window as Window & { __tradelyFilm?: unknown }).__tradelyFilm = tl;
			setReady((value) => value + 1);
		},
		[last, paint, record, shots],
	);

	// The film runs while most of it is on screen and the page is visible.
	useEffect(() => {
		const element = root.current?.querySelector(".wt-film");
		if (!element) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				const viewport = entry.rootBounds?.height || window.innerHeight;
				const amount = entry.isIntersecting
					? Math.max(
							entry.intersectionRatio,
							entry.intersectionRect.height / viewport,
						)
					: 0;
				setVisible(amount >= 0.6);
			},
			{ threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	useEffect(() => {
		const update = () => setHidden(document.hidden);
		update();
		document.addEventListener("visibilitychange", update);
		return () => document.removeEventListener("visibilitychange", update);
	}, []);

	const seekShot = useCallback(
		(index: number, how: VisualLessonPlaybackMode) => {
			const tl = timeline.current;
			const next = Math.max(0, Math.min(last, index));
			shotRef.current = next;
			setShot(next);
			setEnded(false);
			record("visual_lesson_scene_started", shots[next].id, how);
			if (!tl) return;
			const { start } = bounds(tl, next);
			tl.pause();
			tl.seek(start, false);
			time.current = start;
			paint(tl, start);
		},
		[bounds, last, paint, record, shots],
	);

	// Playing: the timeline runs. Reduced motion: each shot shows its last frame for as
	// long as the shot would have taken, then the next.
	useEffect(() => {
		const tl = timeline.current;
		if (!tl) return;
		if (!active) {
			tl.pause();
			return;
		}
		if (!reduced) {
			tl.play();
			return () => {
				tl.pause();
			};
		}
		const { start, end } = bounds(tl, shot);
		tl.pause();
		tl.seek(Math.max(start, end - 0.01), false);
		time.current = tl.time();
		if (fill.current) fill.current.style.transform = "scaleX(1)";
		const timer = window.setTimeout(
			() => {
				if (shot < last) seekShot(shot + 1, "autoplay");
				else {
					record("visual_lesson_scene_completed", shots[last].id, "autoplay");
					setEnded(true);
					setPlaying(false);
				}
			},
			((end - start) * 1000) / rate,
		);
		return () => window.clearTimeout(timer);
	}, [
		active,
		bounds,
		last,
		rate,
		record,
		reduced,
		seekShot,
		shot,
		shots,
		ready,
	]);

	useEffect(() => {
		rateRef.current = rate;
		timeline.current?.timeScale(rate);
	}, [rate]);

	useEffect(() => {
		const target = focusNext.current;
		const element = root.current;
		if (!target || !element) return;
		focusNext.current = null;
		const wanted =
			target === "play"
				? element.querySelector<HTMLElement>('[data-nav="play"]')
				: element.querySelector<HTMLElement>(`[id="${headingId}"]`);
		wanted?.focus({ preventScroll: true });
	});

	const replay = () => {
		setMode("watch");
		focusNext.current = "play";
		seekShot(0, "manual");
		setPlaying(true);
	};

	const openPlayground = (index?: number) => {
		const target =
			index !== undefined && scenes[index]?.explore ? index : playable[0];
		if (target === undefined) return;
		const chosen = scenes[target];
		if (!chosen.explore) return;
		setPlaying(false);
		setPlayScene(target);
		setExplore(
			chosen.explore.start(chosen.beats[chosen.beats.length - 1].state),
		);
		setMode("play");
		record("visual_lesson_scene_started", chosen.id, "manual");
		record("visual_lesson_explored", chosen.id);
		if (lessonId) saveVisualBookmark(lessonId, chosen.id);
		focusNext.current = "heading";
	};

	const cycleRate = () => {
		const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
		setRate(next);
		writeRate(next);
	};

	const onSolved = useCallback(
		(attempts: number) => {
			const chosen = scenes[playScene];
			setSolved((all) => new Set(all).add(chosen.id));
			const task = chosen.explore?.task;
			if (!task || !lessonId || !isCapturing) return;
			capture("visual_lesson_task_completed", {
				lesson_id: lessonId,
				scene_id: chosen.id,
				locale,
				kind: task.kind,
				attempts,
			});
		},
		[capture, isCapturing, lessonId, locale, playScene, scenes],
	);

	const checkYourself = (
		<a
			href="#check-yourself"
			className={buttonVariants({ size: "sm", variant: "outline" })}
		>
			{t(wc.checkYourself)}
			<ArrowDownIcon data-icon="inline-end" aria-hidden="true" />
		</a>
	);

	let body: ReactNode;
	if (mode === "play") {
		const chosen = scenes[playScene];
		const lastBeat = chosen.beats[chosen.beats.length - 1];
		const tasks = playable.filter((index) => scenes[index].explore?.task);
		const allDone =
			tasks.length > 0 && tasks.every((index) => solved.has(scenes[index].id));
		const View = chosen.View;
		body = (
			<Tabs
				className="gap-[inherit]"
				value={String(playScene)}
				onValueChange={(value) => {
					const index = Number(value);
					if (index !== playScene) openPlayground(index);
				}}
			>
				<TabsList
					className="contract-scene-tabs"
					style={{ "--scene-columns": playable.length } as CSSProperties}
					aria-label={t(copy.challenges)}
				>
					{playable.map((index, n) => (
						<TabsTrigger key={scenes[index].id} value={String(index)}>
							<span aria-hidden="true">
								{solved.has(scenes[index].id) ? (
									<CheckIcon className="inline size-3.5" />
								) : (
									String(n + 1).padStart(2, "0")
								)}
							</span>
							{t(scenes[index].label)}
						</TabsTrigger>
					))}
				</TabsList>
				<TabsContent
					key={chosen.id}
					value={String(playScene)}
					className="flex min-w-0 flex-col gap-[inherit] text-[length:inherit]"
				>
					<div className="wt-head">
						<h2 id={headingId} className="wt-title" tabIndex={-1}>
							{t(chosen.title)}
						</h2>
						<div className="wt-caption-stack">
							<p className="wt-caption" aria-live="polite">
								{chosen.explore ? t(chosen.explore.prompt) : null}
							</p>
							{playable.map((index) => {
								const prompt = scenes[index].explore?.prompt;
								return prompt ? (
									<p
										key={prompt[0]}
										className="wt-caption wt-caption-reserve"
										aria-hidden="true"
									>
										{t(prompt)}
									</p>
								) : null;
							})}
						</div>
					</div>
					<FrameContext
						value={{
							locale,
							phase: "explore",
							panel: allDone ? (
								<div className="wt-panel wt-done" data-kind="right">
									<p className="wt-panel-title flex items-center gap-1.5">
										<CheckIcon className="size-4" aria-hidden="true" />
										{t(copy.allDone)}
									</p>
									<p className="wt-panel-note">{t(copy.allDoneNote)}</p>
									<div className="wt-panel-actions">{checkYourself}</div>
								</div>
							) : null,
							task: chosen.explore?.task ? (
								<TaskPanel
									key={chosen.id}
									task={chosen.explore.task as ExploreTask<unknown>}
									explore={explore}
									locale={locale}
									seed={chosen.id}
									solved={solved.has(chosen.id)}
									onSolved={onSolved}
								/>
							) : null,
						}}
					>
						<View
							locale={locale}
							phase="explore"
							beat={chosen.beats.length - 1}
							state={lastBeat.state}
							explore={explore}
							setExplore={setExplore}
						/>
					</FrameContext>
				</TabsContent>
			</Tabs>
		);
	} else {
		const tl = timeline.current;
		const durations = shots.map((_, i) => {
			if (!tl) return 1;
			const { start, end } = bounds(tl, i);
			return Math.max(0.5, end - start);
		});
		body = (
			<>
				<h2 id={headingId} className="sr-only" tabIndex={-1}>
					{t(label)}
				</h2>
				<FilmStage film={film} locale={locale} onTimeline={onTimeline} />
				<fieldset className="wt-nav wt-player-nav">
					<legend className="sr-only">{t(wc.controls)}</legend>
					<Button
						size="sm"
						variant="ghost"
						data-nav="play"
						aria-label={
							ended ? t(copy.replay) : playing ? t(wc.pause) : t(wc.play)
						}
						aria-pressed={!ended && playing}
						onClick={() => {
							if (ended) replay();
							else setPlaying((value) => !value);
						}}
					>
						{ended ? (
							<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
						) : playing ? (
							<PauseIcon data-icon="inline-start" aria-hidden="true" />
						) : (
							<PlayIcon data-icon="inline-start" aria-hidden="true" />
						)}
						<span className="wt-nav-text">
							{ended ? t(copy.replay) : playing ? t(wc.pause) : t(wc.play)}
						</span>
					</Button>
					<ol className="wt-timeline" aria-label={t(copy.timeline)}>
						{shots.map((item, k) => (
							<li
								key={item.id}
								className="wt-frame"
								style={{ "--frames": durations[k] } as CSSProperties}
							>
								<button
									type="button"
									className="wt-segment"
									data-state={
										ended || k < shot ? "done" : k === shot ? "current" : "todo"
									}
									aria-current={k === shot ? "step" : undefined}
									aria-label={`${t(copy.shot)} ${k + 1}: ${t(item.label)}`}
									onClick={() => {
										seekShot(k, "manual");
										setPlaying(true);
									}}
								>
									{k === shot && !ended ? (
										<span ref={fill} className="wt-segment-fill" />
									) : null}
								</button>
							</li>
						))}
					</ol>
					<span className="wt-step-label">
						{`${shot + 1}/${shots.length} · ${t(shots[shot].label)}`}
					</span>
					<Button
						size="sm"
						variant="ghost"
						className="wt-rate"
						aria-label={`${t(copy.speed)}: ${rate}×`}
						onClick={cycleRate}
					>
						{`${rate}×`}
					</Button>
				</fieldset>
				{ended ? (
					<div className="wt-panel wt-ended" data-kind="ended">
						<p className="wt-panel-title">{t(copy.ended)}</p>
						{playable.length ? (
							<p className="wt-panel-note">{t(copy.endedNote)}</p>
						) : null}
						<div className="wt-panel-actions">
							{playable.length ? (
								<Button size="sm" onClick={() => openPlayground()}>
									{t(copy.openPlayground)}
									<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
								</Button>
							) : (
								checkYourself
							)}
							<Button size="sm" variant="outline" onClick={replay}>
								<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
								{t(copy.replay)}
							</Button>
						</div>
					</div>
				) : null}
			</>
		);
	}

	return (
		<section
			ref={root}
			className="walkthrough concept-lab visual-classroom wt-player"
			aria-labelledby={headingId}
			data-walkthrough={id}
			data-walkthrough-ready="true"
			data-player-mode={mode}
			data-scene-id={mode === "play" ? scenes[playScene].id : shots[shot].id}
			data-phase={mode === "play" ? "explore" : "watch"}
			data-shot={shot}
			data-playing={active || undefined}
			data-ended={ended || undefined}
		>
			<Tabs
				className="gap-[inherit]"
				value={mode}
				onValueChange={(value) => {
					if (value === mode) return;
					if (value === "play") openPlayground();
					else {
						setMode("watch");
						if (!ended) setPlaying(true);
						focusNext.current = "heading";
					}
				}}
			>
				{playable.length ? (
					<TabsList className="wt-modes" aria-label={t(copy.modes)}>
						<TabsTrigger value="watch">
							<PlayIcon className="size-3.5" aria-hidden="true" />
							{t(copy.watch)}
						</TabsTrigger>
						<TabsTrigger value="play">{t(copy.playground)}</TabsTrigger>
					</TabsList>
				) : null}
				<TabsContent
					// A new panel per mode: React Aria keeps a panel's first id.
					key={mode}
					value={mode}
					className="flex min-w-0 flex-col gap-[inherit] text-[length:inherit]"
				>
					{body}
				</TabsContent>
			</Tabs>
			<p className="sr-only">{t(label)}</p>
		</section>
	);
}
