import { Button, buttonVariants } from "@tradely/ui/components/button";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import {
	ArrowDownIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	CheckIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
} from "lucide-react";
import * as m from "motion/react-m";
import {
	type CSSProperties,
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { useAnalytics } from "@/analytics/context";
import type {
	VisualLessonPlaybackMode,
	VisualLessonSurface,
} from "@/analytics/events";
import { useVisualLessonAnalytics } from "@/analytics/visual-lesson";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { TermText } from "../term-text";
import {
	initializeVisualBookmark,
	markVisualBookmarkEngaged,
	saveVisualBookmark,
	useVisualBookmarks,
} from "../visual-bookmark";
import { VisualLessonIdentity } from "../visual-lesson-identity";
import { Announce } from "./announce";
import { judge } from "./answers";
import { TaskPanel } from "./explore-task";
import { PredictionFeedback, PredictPanel, predictionCopy } from "./prediction";
import { ReviewSummary } from "./review-summary";
import {
	CountTo,
	TeachMotionProvider,
	useMotionFollow,
	useTeachMotion,
} from "./stage";
import type { ExploreTask, Phase, ResultItem, WalkthroughScene } from "./types";

/** Reading time at about 200 words a minute, plus time to look at the diagram. */
export function readingHoldMs(caption: string) {
	const words = caption.trim().split(/\s+/).filter(Boolean).length;
	return Math.min(16000, Math.max(4000, words * 300 + 1500));
}

type FrameContextValue = {
	locale: Locale;
	phase: Phase;
	panel: ReactNode;
	task: ReactNode;
};

/** What a scene's frame shows beside the stage: the player's panel and any task. */
export const FrameContext = createContext<FrameContextValue | null>(null);

export const copy = {
	back: ["Back", "上一步"],
	next: ["Next", "下一步"],
	play: ["Play", "自动播放"],
	pause: ["Pause", "暂停"],
	restart: ["Restart", "重新开始"],
	predictFirst: predictionCopy.predictFirst,
	skip: ["Skip and watch", "跳过，直接观看"],
	tryIt: ["Try it yourself", "自己试一试"],
	backToSteps: ["Back to the steps", "回到步骤"],
	nextScene: ["Next scene", "下一场景"],
	checkYourself: ["Check yourself", "自我检查"],
	explore: ["Explore", "探索"],
	step: ["Step", "步骤"],
	adjust: ["Adjust the example", "调整示例"],
	moreDetail: ["More detail", "更多细节"],
	scenes: ["Lesson scenes", "课程场景"],
	controls: ["Walkthrough controls", "演示控制"],
	keyResult: ["Key result", "关键结果"],
} as const satisfies Record<string, Copy>;

/**
 * Plays a lesson's scenes as predict, watch and explore. Steps advance when the learner
 * asks; autoplay is optional and paced for reading.
 */
export function Walkthrough({
	locale,
	id,
	label,
	scenes,
	review = false,
}: {
	locale: Locale;
	id: string;
	label: Copy;
	scenes: readonly [WalkthroughScene, ...WalkthroughScene[]];
	/** A checkpoint: the last scene ends with the results, not a link to practice. */
	review?: boolean;
}) {
	const t = (value: Copy) => pick(value, locale);
	const lessonId = useContext(VisualLessonIdentity);
	const bookmarks = useVisualBookmarks();
	const { capture } = useAnalytics();
	const recordVisual = useVisualLessonAnalytics(lessonId, locale);
	const motion = useTeachMotion();
	const root = useRef<HTMLElement>(null);
	const headingId = useId();
	const [sceneId, setSceneId] = useState(scenes[0].id);
	const [beat, setBeat] = useState(0);
	const [predictions, setPredictions] = useState<Record<string, string>>({});
	/** Each scene's first committed answer: a re-answer after the reveal is practice, not a result. */
	const [firstPredictions, setFirstPredictions] = useState<
		Record<string, string>
	>({});
	const [phase, setPhase] = useState<Phase>(
		scenes[0].predict ? "predict" : "watch",
	);
	const [explore, setExplore] = useState<unknown>(null);
	const [autoplay, setAutoplay] = useState(false);
	const [visible, setVisible] = useState(false);
	const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
	const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
	const {
		following,
		reset: resetMotionFollow,
		noteChange: noteExploreChange,
		setPointerDragging,
	} = useMotionFollow();
	const restored = useRef(false);
	/**
	 * Where focus goes after a control removes itself, such as "Try it yourself" or
	 * "Next scene"; otherwise a keyboard or screen reader user is left on the page body.
	 */
	const focusNext = useRef<
		"heading" | "controls" | "feedback" | "actions" | null
	>(null);
	const scene = scenes.find((item) => item.id === sceneId) ?? scenes[0];
	const index = scenes.indexOf(scene);
	const last = scene.beats.length - 1;
	const current = scene.beats[Math.min(beat, last)];
	const prediction = predictions[scene.id];
	const revealAt = scene.predict?.revealAt ?? 1;
	const task = scene.explore?.task as ExploreTask<unknown> | undefined;
	const reachSolved =
		task?.kind === "reach" &&
		explore !== null &&
		task.reached(explore) &&
		solved.has(scene.id);

	const record = useCallback(
		(
			event:
				| "visual_lesson_scene_started"
				| "visual_lesson_scene_completed"
				| "visual_lesson_explored",
			mode?: VisualLessonPlaybackMode,
			surface: VisualLessonSurface = "walkthrough",
		) => {
			if (lessonId && event === "visual_lesson_scene_started")
				markVisualBookmarkEngaged(lessonId, scene.id);
			return recordVisual(event, scene.id, surface, mode);
		},
		[lessonId, recordVisual, scene.id],
	);

	const openScene = useCallback(
		(next: WalkthroughScene) => {
			resetMotionFollow();
			setSceneId(next.id);
			setBeat(0);
			setPhase(next.predict && !predictions[next.id] ? "predict" : "watch");
			setExplore(null);
			setAutoplay(false);
			if (lessonId) saveVisualBookmark(lessonId, next.id);
		},
		[lessonId, predictions, resetMotionFollow],
	);

	useEffect(() => {
		if (restored.current || !lessonId) return;
		restored.current = true;
		const saved = bookmarks[lessonId];
		const match = scenes.find((item) => item.id === saved);
		if (match && match.id !== scenes[0].id) openScene(match);
		else if (!saved) initializeVisualBookmark(lessonId, scenes[0].id);
	}, [bookmarks, lessonId, openScene, scenes]);

	const finish = useCallback(
		(mode: VisualLessonPlaybackMode) => {
			record("visual_lesson_scene_completed", mode);
			setCompleted((done) => new Set(done).add(scene.id));
		},
		[record, scene.id],
	);

	const goTo = useCallback(
		(target: number, mode: VisualLessonPlaybackMode = "manual") => {
			resetMotionFollow();
			const next = Math.max(0, Math.min(last, target));
			// Next and Play are disabled on the last step; if one had focus, hand it to the scene's
			// first action rather than drop it on the page.
			const focused = document.activeElement;
			if (
				next === last &&
				focused instanceof HTMLElement &&
				(focused.dataset.nav === "next" || focused.dataset.nav === "play")
			)
				focusNext.current = "actions";
			record("visual_lesson_scene_started", mode);
			setPhase("watch");
			setExplore(null);
			setBeat(next);
			if (next === last) finish(mode);
		},
		[finish, last, record, resetMotionFollow],
	);

	const advance = useCallback(
		(mode: VisualLessonPlaybackMode = "manual") => {
			if (phase === "explore") return;
			if (beat < last) goTo(beat + 1, mode);
			else {
				finish(mode);
				setAutoplay(false);
			}
		},
		[beat, finish, goTo, last, phase],
	);

	const startExplore = () => {
		if (!scene.explore) return;
		resetMotionFollow();
		focusNext.current = "controls";
		record("visual_lesson_scene_started", "manual", "playground");
		record("visual_lesson_explored", undefined, "playground");
		setAutoplay(false);
		setExplore(scene.explore.start(current.state));
		setPhase("explore");
	};

	const choose = (choice: string) => {
		focusNext.current = "feedback";
		setPredictions((all) => ({ ...all, [scene.id]: choice }));
		setFirstPredictions((all) =>
			Object.hasOwn(all, scene.id) ? all : { ...all, [scene.id]: choice },
		);
		if (scene.predict && lessonId)
			capture("visual_lesson_predicted", {
				lesson_id: lessonId,
				scene_id: scene.id,
				locale,
				surface: "walkthrough",
				kind: choice.startsWith("entry:") ? "entry" : "choice",
				correct: judge(scene.predict, choice).correct,
			});
		// Play on from the setup; feedback appears once the answering step is on screen.
		goTo(revealAt === 0 ? 0 : Math.min(1, last));
	};

	const restart = () => {
		resetMotionFollow();
		setPredictions((all) => {
			const next = { ...all };
			delete next[scene.id];
			return next;
		});
		setBeat(0);
		setExplore(null);
		setAutoplay(false);
		setPhase(scene.predict ? "predict" : "watch");
	};

	// Autoplay waits for most of the scene to be on screen and for the page to be visible.
	useEffect(() => {
		const element = root.current;
		if (!element) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				const viewport = entry.rootBounds?.height || window.innerHeight;
				const shown = entry.isIntersecting
					? Math.max(
							entry.intersectionRatio,
							entry.intersectionRect.height / viewport,
						)
					: 0;
				setVisible(shown >= 0.6);
			},
			{ threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	useEffect(() => {
		if (!autoplay || phase !== "watch" || !visible) return;
		const timer = window.setTimeout(() => {
			if (document.hidden) return;
			advance("autoplay");
		}, readingHoldMs(current.caption[0]));
		return () => window.clearTimeout(timer);
	}, [advance, autoplay, current.caption, phase, visible]);
	useEffect(() => {
		if (autoplay && beat === last && phase === "watch") setAutoplay(false);
	}, [autoplay, beat, last, phase]);

	useEffect(() => {
		const target = focusNext.current;
		const element = root.current;
		if (!target || !element) return;
		focusNext.current = null;
		const heading = element.querySelector<HTMLElement>(`[id="${headingId}"]`);
		const wanted =
			target === "controls"
				? element.querySelector<HTMLElement>(
						":is(.wt-task, .wt-controls) :is(input, button, [role=slider], [tabindex='0'])",
					)
				: target === "feedback"
					? element.querySelector<HTMLElement>("[data-focus=feedback]")
					: target === "actions"
						? element.querySelector<HTMLElement>(
								".wt-panel-actions :is(a, button)",
							)
						: heading;
		// When the stage sits above the controls, bring it into view with them, so the learner
		// sees what each control changes.
		const main = element.querySelector<HTMLElement>(".wt-main");
		const stacked =
			!!main &&
			getComputedStyle(main).gridTemplateColumns.split(" ").length < 2;
		if (target === "controls" && stacked) {
			(wanted ?? heading)?.focus({ preventScroll: true });
			// A pinned stage always counts as in view, so scroll to where the scene starts.
			const stage = element.querySelector<HTMLElement>(".wt-stage");
			const scene = stage?.parentElement;
			if (stage && scene)
				window.scrollTo({
					top:
						window.scrollY +
						scene.getBoundingClientRect().top -
						Number.parseFloat(getComputedStyle(stage).scrollMarginTop),
					behavior: motion.enabled ? "smooth" : "auto",
				});
			return;
		}
		(wanted ?? heading)?.focus();
	});

	const onSolved = useCallback(
		(attempts: number) => {
			setSolved((all) => new Set(all).add(scene.id));
			const task = scene.explore?.task;
			if (!task || !lessonId) return;
			capture("visual_lesson_task_completed", {
				lesson_id: lessonId,
				scene_id: scene.id,
				locale,
				surface: "playground",
				kind: task.kind,
				attempts,
			});
		},
		[capture, lessonId, locale, scene],
	);

	// With a task waiting, "Try it yourself" leads and moving on is the quieter choice.
	const quiet = phase === "watch" && !!scene.explore?.task;
	const onward =
		index < scenes.length - 1 ? (
			<Button
				size="sm"
				variant={quiet ? "outline" : undefined}
				onClick={() => {
					focusNext.current = "heading";
					openScene(scenes[index + 1]);
				}}
			>
				{t(copy.nextScene)}
				<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
			</Button>
		) : review ? null : (
			// After the last scene comes the lesson's own practice, just below the walkthrough.
			<a
				href="#check-yourself"
				className={buttonVariants({
					size: "sm",
					variant: quiet ? "outline" : undefined,
				})}
			>
				{t(copy.checkYourself)}
				<ArrowDownIcon data-icon="inline-end" aria-hidden="true" />
			</a>
		);

	const caption =
		phase === "predict" && scene.predict
			? scene.predict.prompt
			: phase === "explore" && scene.explore
				? scene.explore.prompt
				: current.caption;
	const panel =
		phase === "predict" && scene.predict ? (
			<PredictPanel
				key={scene.id}
				prediction={scene.predict}
				seed={scene.id}
				locale={locale}
				skip={copy.skip}
				onChoose={choose}
				onSkip={() => {
					focusNext.current = "heading";
					setPhase("watch");
					record("visual_lesson_scene_started", "manual");
				}}
			/>
		) : (
			<>
				{phase === "watch" &&
				scene.predict &&
				prediction &&
				beat >= revealAt ? (
					<PredictionFeedback
						prediction={scene.predict}
						answer={prediction}
						locale={locale}
					/>
				) : null}
				{phase === "watch" && beat === last ? (
					<div className="wt-panel-actions">
						{scene.explore ? (
							<Button
								size="sm"
								variant={quiet ? undefined : "outline"}
								onClick={startExplore}
							>
								{t(copy.tryIt)}
							</Button>
						) : null}
						{onward}
					</div>
				) : null}
				{phase === "explore" ? (
					<div className="wt-panel-actions">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								focusNext.current = "heading";
								goTo(last);
							}}
						>
							<ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
							{t(copy.backToSteps)}
						</Button>
						{onward}
					</div>
				) : null}
				{review &&
				index === scenes.length - 1 &&
				((phase === "watch" && beat === last) || phase === "explore") ? (
					<ReviewSummary
						locale={locale}
						scenes={scenes}
						predictions={firstPredictions}
					/>
				) : null}
			</>
		);

	const View = scene.View;
	return (
		<section
			ref={root}
			className="walkthrough concept-lab visual-classroom"
			aria-labelledby={headingId}
			data-walkthrough={id}
			data-walkthrough-ready="true"
			data-scene-id={scene.id}
			data-phase={phase}
			data-beat={beat}
		>
			{/* The open scene is the selected tab's panel, so each tab controls what it shows. */}
			<Tabs
				className="gap-[inherit]"
				value={scene.id}
				onValueChange={(value) => {
					const next = scenes.find((item) => item.id === String(value));
					if (next && next.id !== scene.id) openScene(next);
				}}
			>
				<TabsList
					className="contract-scene-tabs"
					style={{ "--scene-columns": scenes.length } as CSSProperties}
					aria-label={t(copy.scenes)}
				>
					{scenes.map((item, i) => (
						<TabsTrigger key={item.id} value={item.id}>
							<span aria-hidden="true">
								{completed.has(item.id) ? (
									<CheckIcon className="inline size-3.5" />
								) : (
									String(i + 1).padStart(2, "0")
								)}
							</span>
							{t(item.label)}
						</TabsTrigger>
					))}
				</TabsList>
				<TabsContent
					// A new panel per scene: React Aria keeps a panel's first id, so a reused
					// one would stay tied to the first scene's tab.
					key={scene.id}
					value={scene.id}
					className="flex min-w-0 flex-col gap-[inherit] text-[length:inherit]"
				>
					<div className="wt-head">
						<h2 id={headingId} className="wt-title" tabIndex={-1}>
							{t(scene.title)}
						</h2>
						<div className="wt-caption-stack">
							<p className="wt-caption">
								{phase === "predict" ? (
									t(caption)
								) : (
									<TermText text={t(caption)} locale={locale} />
								)}
							</p>
							<Announce text={t(caption)} off={autoplay} />
							{[
								scene.predict?.prompt,
								scene.explore?.prompt,
								...scene.beats.map((item) => item.caption),
							]
								.filter((item): item is Copy => Boolean(item))
								.map((item) => (
									<p
										key={item[0]}
										className="wt-caption wt-caption-reserve"
										aria-hidden="true"
									>
										{t(item)}
									</p>
								))}
						</div>
					</div>
					<fieldset className="wt-nav">
						<legend className="sr-only">{t(copy.controls)}</legend>
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								phase === "explore" ? goTo(last) : goTo(beat - 1)
							}
							disabled={
								phase === "predict" || (phase === "watch" && beat === 0)
							}
						>
							<ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
							<span className="wt-nav-text">{t(copy.back)}</span>
						</Button>
						<ol className="wt-dots">
							{scene.beats.map((item, i) => (
								<li key={item.id}>
									<button
										type="button"
										className="wt-dot"
										data-state={
											phase !== "watch" || i > beat
												? "todo"
												: i === beat
													? "current"
													: "done"
										}
										aria-current={
											phase === "watch" && i === beat ? "step" : undefined
										}
										aria-label={`${t(copy.step)} ${i + 1}: ${t(item.label)}`}
										disabled={phase === "predict"}
										onClick={() => goTo(i)}
									/>
								</li>
							))}
						</ol>
						<span className="wt-step-label">
							{phase === "explore"
								? t(copy.explore)
								: phase === "predict"
									? t(copy.predictFirst)
									: `${beat + 1}/${scene.beats.length} · ${t(current.label)}`}
						</span>
						<span className="wt-nav-spacer" />
						<Button
							size="sm"
							variant="ghost"
							data-nav="play"
							aria-label={autoplay ? t(copy.pause) : t(copy.play)}
							aria-pressed={autoplay}
							disabled={phase !== "watch" || beat === last}
							onClick={() => setAutoplay((value) => !value)}
						>
							{autoplay ? (
								<PauseIcon data-icon="inline-start" aria-hidden="true" />
							) : (
								<PlayIcon data-icon="inline-start" aria-hidden="true" />
							)}
							<span className="wt-nav-text">
								{autoplay ? t(copy.pause) : t(copy.play)}
							</span>
						</Button>
						<Button
							size="sm"
							variant="ghost"
							aria-label={t(copy.restart)}
							onClick={restart}
						>
							<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
							<span className="wt-nav-text">{t(copy.restart)}</span>
						</Button>
						<Button
							size="sm"
							data-nav="next"
							onClick={() => advance()}
							disabled={phase !== "watch" || beat === last}
						>
							{t(copy.next)}
							<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
						</Button>
					</fieldset>
					<TeachMotionProvider
						following={following}
						solvedReach={reachSolved}
						setPointerDragging={setPointerDragging}
					>
						<FrameContext
							value={{
								locale,
								phase,
								panel,
								task:
									phase === "explore" && scene.explore?.task ? (
										<TaskPanel
											key={scene.id}
											task={scene.explore.task as ExploreTask<unknown>}
											explore={explore}
											locale={locale}
											seed={scene.id}
											solved={solved.has(scene.id)}
											onSolved={onSolved}
										/>
									) : null,
							}}
						>
							<View
								locale={locale}
								phase={phase}
								beat={beat}
								state={current.state}
								explore={phase === "explore" ? explore : null}
								setExplore={(next: unknown) => {
									noteExploreChange();
									record("visual_lesson_explored", undefined, "playground");
									recordVisual(
										"visual_lesson_interacted",
										scene.id,
										"playground",
									);
									setExplore(next);
								}}
							/>
						</FrameContext>
					</TeachMotionProvider>
				</TabsContent>
			</Tabs>
			<p className="sr-only">{t(label)}</p>
		</section>
	);
}

/** Lays out one scene: the stage, then its result, the player's panel and any controls. */
export function SceneFrame({
	stage,
	result,
	controls,
	details,
}: {
	stage: ReactNode;
	result?: readonly ResultItem[];
	controls?: ReactNode;
	details?: ReactNode;
}) {
	const frame = useContext(FrameContext);
	const locale = frame?.locale ?? "en";
	const t = (value: Copy) => pick(value, locale);
	// A stage short enough to share a phone screen with its controls stays pinned while
	// the learner adjusts them; a taller one would leave no room and scrolls as usual.
	const stageBox = useRef<HTMLDivElement>(null);
	const [pinnable, setPinnable] = useState(false);
	useEffect(() => {
		const element = stageBox.current;
		if (!element) return;
		const measure = () =>
			setPinnable(element.offsetHeight <= window.innerHeight * 0.55);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);
	return (
		<div className="wt-scene">
			<div className="wt-main">
				<div
					ref={stageBox}
					className="wt-stage"
					data-pinnable={pinnable || undefined}
				>
					{stage}
				</div>
				<div className="wt-side">
					{/* Results would answer the prediction, so they wait until the learner commits. */}
					{result?.length && frame?.phase !== "predict" ? (
						<section className="wt-results" aria-label={t(copy.keyResult)}>
							<dl>
								{result.map((item) => (
									<ResultCard key={item.id} item={item} />
								))}
							</dl>
						</section>
					) : null}
					{frame?.panel}
					{frame?.task}
					{frame?.phase === "explore" && controls ? (
						<fieldset className="wt-controls">
							<legend className="sr-only">{t(copy.adjust)}</legend>
							{controls}
						</fieldset>
					) : null}
				</div>
			</div>
			{details ? (
				<DisclosurePanel
					className="visual-explore"
					summary={t(copy.moreDetail)}
				>
					<div className="flex min-w-0 flex-col gap-4 pt-4 text-muted-foreground text-sm leading-7">
						{details}
					</div>
				</DisclosurePanel>
			) : null}
		</div>
	);
}

function ResultCard({ item }: { item: ResultItem }) {
	const motion = useTeachMotion();
	return (
		<div
			className="wt-result"
			data-tone={item.tone}
			data-evidence={item.evidence}
			style={{ backgroundColor: "var(--card)" }}
		>
			<dt>{item.label}</dt>
			<dd>
				{/* A counted figure keeps its element so it can count; plain text re-enters on change. */}
				<m.span
					key={item.tween ? undefined : item.value}
					className="wt-result-value"
					initial={motion.enabled ? { opacity: 0.2, y: 3 } : false}
					animate={{ opacity: 1, y: 0 }}
					transition={motion.fade}
				>
					{item.tween ? (
						<CountTo value={item.tween.to} format={item.tween.format} />
					) : (
						item.value
					)}
				</m.span>
				{item.note ? <span className="wt-result-note">{item.note}</span> : null}
			</dd>
		</div>
	);
}
