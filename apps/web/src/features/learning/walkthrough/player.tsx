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
import * as m from "motion/react-m";
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
	useVisualBookmarks,
} from "../visual-bookmark";
import { VisualLessonIdentity } from "../visual-lesson-identity";
import { judge, seededOrder } from "./answers";
import { TaskPanel } from "./explore-task";
import { useTeachMotion } from "./stage";
import type { ExploreTask, Phase, WalkthroughScene } from "./types";
import {
	FrameContext,
	readingHoldMs,
	copy as walkthroughCopy,
} from "./walkthrough";

/**
 * One frame of the lesson's timeline: a scene's question to think about before it plays,
 * or one of its beats. `hold` is how long it stays on screen at 1×.
 */
type Frame = { scene: number; hold: number } & (
	| { kind: "think" }
	| { kind: "beat"; beat: number }
);

/** Time to think about a question after reading it; a choice ends the wait early. */
const THINK_MS = 3000;

function buildFrames(scenes: readonly WalkthroughScene[]): Frame[] {
	const frames: Frame[] = [];
	scenes.forEach((scene, index) => {
		if (scene.predict) {
			frames.push({
				kind: "think",
				scene: index,
				hold: readingHoldMs(scene.predict.prompt[0]) + THINK_MS,
			});
		}
		scene.beats.forEach((beat, beatIndex) => {
			frames.push({
				kind: "beat",
				scene: index,
				beat: beatIndex,
				hold: readingHoldMs(beat.caption[0]),
			});
		});
	});
	return frames;
}

const RATES = [1, 1.5, 2] as const;
type Rate = (typeof RATES)[number];
const rateKey = "tradely:player-rate:v1";
const isRate = (value: number): value is Rate =>
	(RATES as readonly number[]).includes(value);
function readRate(): Rate {
	try {
		const stored = Number(localStorage.getItem(rateKey));
		return isRate(stored) ? stored : 1;
	} catch {
		return 1;
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
	timeline: ["Lesson timeline", "课程时间轴"],
	scene: ["Scene", "场景"],
	speed: ["Speed", "速度"],
	orWatch: ["Pick one, or let it play on.", "选一个，或让它继续播放。"],
	justWatch: ["Just watch", "直接观看"],
	theAnswer: ["The answer", "答案"],
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
 * Plays a lesson as one motion graphic: every scene's question, then its beats, on a
 * timeline that runs by itself once the player is on screen. The playground opens the
 * same scenes for the learner to drive, each with its challenge.
 */
export function Player({
	locale,
	id,
	label,
	scenes,
}: {
	locale: Locale;
	id: string;
	label: Copy;
	scenes: readonly [WalkthroughScene, ...WalkthroughScene[]];
}) {
	const t = (value: Copy) => pick(value, locale);
	const wc = walkthroughCopy;
	const lessonId = useContext(VisualLessonIdentity);
	const bookmarks = useVisualBookmarks();
	const { capture, isCapturing } = useAnalytics();
	const motion = useTeachMotion();
	const root = useRef<HTMLElement>(null);
	const fill = useRef<HTMLSpanElement>(null);
	const headingId = useId();
	const frames = useMemo(() => buildFrames(scenes), [scenes]);
	const last = frames.length - 1;
	const [frame, setFrame] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [visible, setVisible] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [rate, setRate] = useState<Rate>(1);
	const [mode, setMode] = useState<Mode>("watch");
	const [predictions, setPredictions] = useState<Record<string, string>>({});
	const [playScene, setPlayScene] = useState(0);
	const [explore, setExplore] = useState<unknown>(null);
	const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
	/** How much of a frame has already been shown, so a pause resumes where it stopped. */
	const shown = useRef({ frame: -1, ms: 0 });
	const started = useRef(new Set<string>());
	const finished = useRef(new Set<string>());
	const explored = useRef(new Set<string>());
	const restored = useRef(false);
	const focusNext = useRef<"heading" | "play" | null>(null);

	const current = frames[frame];
	const scene = scenes[current.scene];
	const beatIndex = current.kind === "beat" ? current.beat : 0;
	const beat = scene.beats[beatIndex];
	const ended = frame === last;
	/** Scenes the learner can drive. */
	const playable = useMemo(
		() => scenes.flatMap((item, index) => (item.explore ? [index] : [])),
		[scenes],
	);
	const active = mode === "watch" && playing && visible && !hidden;

	useEffect(() => {
		setRate(readRate());
	}, []);

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

	const seek = useCallback(
		(target: number, how: VisualLessonPlaybackMode) => {
			const next = Math.max(0, Math.min(last, target));
			const to = frames[next];
			const toScene = scenes[to.scene];
			shown.current = { frame: -1, ms: 0 };
			setFrame(next);
			if (next === last) setPlaying(false);
			if (to.kind === "beat") {
				record("visual_lesson_scene_started", toScene.id, how);
				if (to.beat === toScene.beats.length - 1)
					record("visual_lesson_scene_completed", toScene.id, how);
			}
			if (lessonId) saveVisualBookmark(lessonId, toScene.id);
		},
		[frames, last, lessonId, record, scenes],
	);

	const advance = useCallback(
		(how: VisualLessonPlaybackMode) => {
			if (frame < last) seek(frame + 1, how);
			else setPlaying(false);
		},
		[frame, last, seek],
	);

	// A returning learner picks up at the scene they left; a new one starts at the top.
	useEffect(() => {
		if (restored.current || !lessonId) return;
		restored.current = true;
		const saved = bookmarks[lessonId];
		const index = scenes.findIndex((item) => item.id === saved);
		if (index > 0) {
			const first = frames.findIndex((item) => item.scene === index);
			if (first > 0) {
				shown.current = { frame: -1, ms: 0 };
				setFrame(first);
			}
		} else if (!saved) initializeVisualBookmark(lessonId, scenes[0].id);
	}, [bookmarks, frames, lessonId, scenes]);

	// The timeline runs while most of the player is on screen and the page is visible.
	useEffect(() => {
		const element = root.current;
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

	// Each frame holds for its reading time at the chosen rate; the segment fills as it goes.
	useEffect(() => {
		if (!active) return;
		const already = shown.current.frame === frame ? shown.current.ms : 0;
		const { hold } = current;
		const start = performance.now();
		const element = fill.current;
		let raf = 0;
		const paint = () => {
			const ms = Math.min(hold, already + (performance.now() - start) * rate);
			shown.current = { frame, ms };
			if (element) element.style.transform = `scaleX(${ms / hold})`;
			raf = requestAnimationFrame(paint);
		};
		raf = requestAnimationFrame(paint);
		const timer = window.setTimeout(
			() => advance("autoplay"),
			Math.max(0, hold - already) / rate,
		);
		return () => {
			cancelAnimationFrame(raf);
			window.clearTimeout(timer);
		};
	}, [active, advance, current, frame, rate]);

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

	const choose = (choice: string) => {
		setPredictions((all) => ({ ...all, [scene.id]: choice }));
		if (scene.predict && lessonId && isCapturing)
			capture("visual_lesson_predicted", {
				lesson_id: lessonId,
				scene_id: scene.id,
				locale,
				kind: "choice",
				correct: judge(scene.predict, choice).correct,
			});
		focusNext.current = "play";
		seek(frame + 1, "manual");
		setPlaying(true);
	};

	const replay = () => {
		setPredictions({});
		setMode("watch");
		focusNext.current = "play";
		seek(0, "manual");
		setPlaying(true);
	};

	const openPlayground = (index = current.scene) => {
		const target = scenes[index].explore ? index : playable[0];
		if (target === undefined) return;
		const chosen = scenes[target];
		if (!chosen.explore) return;
		// The scene on stage carries on from where the animation left it.
		const from =
			target === current.scene && current.kind === "beat"
				? beat.state
				: chosen.beats[chosen.beats.length - 1].state;
		setPlaying(false);
		setPlayScene(target);
		setExplore(chosen.explore.start(from));
		setMode("play");
		record("visual_lesson_scene_started", chosen.id, "manual");
		record("visual_lesson_explored", chosen.id);
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

	const reserve = (items: readonly (Copy | undefined)[]) =>
		items
			.filter((item): item is Copy => Boolean(item))
			.map((item) => (
				<p
					key={item[0]}
					className="wt-caption wt-caption-reserve"
					aria-hidden="true"
				>
					{t(item)}
				</p>
			));

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
							{reserve(playable.map((index) => scenes[index].explore?.prompt))}
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
		const phase: Phase = current.kind === "think" ? "predict" : "watch";
		const caption =
			current.kind === "think" && scene.predict
				? scene.predict.prompt
				: beat.caption;
		const prediction = predictions[scene.id];
		const verdict =
			scene.predict && prediction ? judge(scene.predict, prediction) : null;
		const choice = scene.predict?.choices.find(
			(item) => item.id === prediction,
		);
		const revealed =
			current.kind === "beat" &&
			!!scene.predict &&
			beatIndex >= (scene.predict.revealAt ?? 1);
		const panel =
			current.kind === "think" && scene.predict ? (
				<div className="wt-panel" data-kind="predict">
					<p className="wt-panel-title">{t(wc.predictFirst)}</p>
					<div className="wt-choices">
						{seededOrder(scene.predict.choices, scene.id).map((item) => (
							<Button
								key={item.id}
								variant="outline"
								className="wt-choice"
								data-choice={item.id}
								onClick={() => choose(item.id)}
							>
								{t(item.label)}
							</Button>
						))}
					</div>
					<p className="wt-panel-note">{t(copy.orWatch)}</p>
					<button
						type="button"
						className="wt-link"
						onClick={() => {
							focusNext.current = "play";
							seek(frame + 1, "manual");
							setPlaying(true);
						}}
					>
						{t(copy.justWatch)}
					</button>
				</div>
			) : (
				<>
					{revealed && scene.predict ? (
						<m.div
							className="wt-panel"
							data-kind={
								verdict ? (verdict.correct ? "right" : "wrong") : "answer"
							}
							initial={motion.enabled ? { opacity: 0, y: 6 } : false}
							animate={{ opacity: 1, y: 0 }}
							transition={motion.fade}
						>
							<p className="wt-panel-title">
								{verdict
									? verdict.correct
										? t(wc.right)
										: t(wc.wrong)
									: t(copy.theAnswer)}
							</p>
							{choice ? (
								<p className="wt-panel-note">
									{t(wc.youChose)}
									{t(choice.label)}
								</p>
							) : null}
							<p>{t(scene.predict.explain)}</p>
						</m.div>
					) : null}
					{ended ? (
						<div className="wt-panel" data-kind="ended">
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
		const View = scene.View;
		body = (
			<>
				<div className="wt-head">
					<h2 id={headingId} className="wt-title" tabIndex={-1}>
						{t(scene.title)}
					</h2>
					<div className="wt-caption-stack">
						<p className="wt-caption" aria-live={active ? "off" : "polite"}>
							{t(caption)}
						</p>
						{reserve(
							scenes.flatMap((item) => [
								item.predict?.prompt,
								...item.beats.map((b) => b.caption),
							]),
						)}
					</div>
				</div>
				<fieldset className="wt-nav wt-player-nav">
					<legend className="sr-only">{t(wc.controls)}</legend>
					<Button
						size="sm"
						variant="ghost"
						data-nav="play"
						aria-label={
							ended && !playing
								? t(copy.replay)
								: playing
									? t(wc.pause)
									: t(wc.play)
						}
						aria-pressed={!ended && playing}
						onClick={() => {
							if (ended && !playing) replay();
							else setPlaying((value) => !value);
						}}
					>
						{ended && !playing ? (
							<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
						) : playing ? (
							<PauseIcon data-icon="inline-start" aria-hidden="true" />
						) : (
							<PlayIcon data-icon="inline-start" aria-hidden="true" />
						)}
						<span className="wt-nav-text">
							{ended && !playing
								? t(copy.replay)
								: playing
									? t(wc.pause)
									: t(wc.play)}
						</span>
					</Button>
					<ol className="wt-timeline" aria-label={t(copy.timeline)}>
						{scenes.map((item, index) => {
							const own = frames.flatMap((f, k) =>
								f.scene === index ? [{ f, k }] : [],
							);
							return (
								<li
									key={item.id}
									className="wt-chapter"
									style={{ "--frames": own.length } as CSSProperties}
								>
									<ol>
										{own.map(({ f, k }) => (
											<li key={k} className="wt-frame">
												<button
													type="button"
													className="wt-segment"
													data-state={
														ended || k < frame
															? "done"
															: k === frame
																? "current"
																: "todo"
													}
													aria-current={k === frame ? "step" : undefined}
													aria-label={`${t(copy.scene)} ${index + 1}: ${t(item.label)} · ${
														f.kind === "think"
															? t(wc.predictFirst)
															: t(item.beats[f.beat].label)
													}`}
													onClick={() => {
														seek(k, "manual");
														if (k < last) setPlaying(true);
													}}
												>
													{k === frame && !ended ? (
														<span ref={fill} className="wt-segment-fill" />
													) : null}
												</button>
											</li>
										))}
									</ol>
								</li>
							);
						})}
					</ol>
					<span className="wt-step-label">
						{`${current.scene + 1}/${scenes.length} · ${t(scene.label)}`}
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
				<FrameContext value={{ locale, phase, panel, task: null }}>
					<View
						locale={locale}
						phase={phase}
						beat={beatIndex}
						state={beat.state}
						explore={null}
						setExplore={() => {}}
					/>
				</FrameContext>
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
			data-scene-id={mode === "play" ? scenes[playScene].id : scene.id}
			data-phase={
				mode === "play"
					? "explore"
					: current.kind === "think"
						? "predict"
						: "watch"
			}
			data-beat={beatIndex}
			data-frame={frame}
			data-playing={active || undefined}
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
