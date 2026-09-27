import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { Tabs, TabsList, TabsTrigger } from "@tradely/ui/components/tabs";
import {
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
import type { VisualLessonPlaybackMode } from "@/analytics/events";
import { getLessonById, getNextLesson } from "@/content/course";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import {
	initializeVisualBookmark,
	markVisualBookmarkEngaged,
	saveVisualBookmark,
	useVisualBookmarks,
} from "../visual-bookmark";
import { VisualLessonIdentity } from "../visual-playback";
import { readingHoldMs } from "../visual-step";
import { useTeachMotion } from "./stage";
import type { Phase, ResultItem, WalkthroughScene } from "./types";

type FrameContextValue = { locale: Locale; phase: Phase; panel: ReactNode };
const FrameContext = createContext<FrameContextValue | null>(null);

const copy = {
	back: ["Back", "上一步"],
	next: ["Next", "下一步"],
	play: ["Play", "自动播放"],
	pause: ["Pause", "暂停"],
	restart: ["Restart", "重新开始"],
	predictFirst: ["Predict first", "先预测"],
	skip: ["Skip and watch", "跳过，直接观看"],
	right: ["You predicted it", "预测正确"],
	wrong: ["Not quite", "与预测不同"],
	youChose: ["You chose", "你的选择"],
	tryIt: ["Try it yourself", "自己试一试"],
	backToSteps: ["Back to the steps", "回到步骤"],
	nextScene: ["Next scene", "下一场景"],
	nextLesson: ["Next lesson", "下一课"],
	course: ["Back to the course", "回到课程"],
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
}: {
	locale: Locale;
	id: string;
	label: Copy;
	scenes: readonly [WalkthroughScene, ...WalkthroughScene[]];
}) {
	const t = (value: Copy) => pick(value, locale);
	const lessonId = useContext(VisualLessonIdentity);
	const bookmarks = useVisualBookmarks();
	const { capture, isCapturing } = useAnalytics();
	const motion = useTeachMotion();
	const root = useRef<HTMLElement>(null);
	const headingId = useId();
	const [sceneId, setSceneId] = useState(scenes[0].id);
	const [beat, setBeat] = useState(0);
	const [predictions, setPredictions] = useState<Record<string, string>>({});
	const [phase, setPhase] = useState<Phase>(
		scenes[0].predict ? "predict" : "watch",
	);
	const [explore, setExplore] = useState<unknown>(null);
	const [autoplay, setAutoplay] = useState(false);
	const [visible, setVisible] = useState(false);
	const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
	const started = useRef(new Set<string>());
	const finished = useRef(new Set<string>());
	const explored = useRef(new Set<string>());
	const restored = useRef(false);
	const scene = scenes.find((item) => item.id === sceneId) ?? scenes[0];
	const index = scenes.indexOf(scene);
	const last = scene.beats.length - 1;
	const current = scene.beats[Math.min(beat, last)];
	const prediction = predictions[scene.id];
	const revealAt = scene.predict?.revealAt ?? 1;

	const record = useCallback(
		(
			event:
				| "visual_lesson_scene_started"
				| "visual_lesson_scene_completed"
				| "visual_lesson_explored",
			mode?: VisualLessonPlaybackMode,
		) => {
			if (!lessonId) return;
			const seen =
				event === "visual_lesson_scene_started"
					? started
					: event === "visual_lesson_scene_completed"
						? finished
						: explored;
			if (seen.current.has(scene.id)) return;
			seen.current.add(scene.id);
			if (event === "visual_lesson_scene_started")
				markVisualBookmarkEngaged(lessonId, scene.id);
			if (!isCapturing) return;
			const base = { lesson_id: lessonId, scene_id: scene.id, locale };
			if (event === "visual_lesson_explored") capture(event, base);
			else capture(event, { ...base, mode: mode ?? "manual" });
		},
		[capture, isCapturing, lessonId, locale, scene.id],
	);

	const openScene = useCallback(
		(next: WalkthroughScene) => {
			setSceneId(next.id);
			setBeat(0);
			setPhase(next.predict && !predictions[next.id] ? "predict" : "watch");
			setExplore(null);
			setAutoplay(false);
			if (lessonId) saveVisualBookmark(lessonId, next.id);
		},
		[lessonId, predictions],
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
			const next = Math.max(0, Math.min(last, target));
			record("visual_lesson_scene_started", mode);
			setPhase("watch");
			setExplore(null);
			setBeat(next);
			if (next === last) finish(mode);
		},
		[finish, last, record],
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
		record("visual_lesson_scene_started", "manual");
		record("visual_lesson_explored");
		setAutoplay(false);
		setExplore(scene.explore.start(current.state));
		setPhase("explore");
	};

	const choose = (choice: string) => {
		setPredictions((all) => ({ ...all, [scene.id]: choice }));
		// Play on from the setup; feedback appears once the answering step is on screen.
		goTo(revealAt === 0 ? 0 : Math.min(1, last));
	};

	const restart = () => {
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

	const lesson = lessonId ? getLessonById(lessonId) : undefined;
	const nextLesson = lesson ? getNextLesson(lesson.slug) : undefined;
	const onward =
		index < scenes.length - 1 ? (
			<Button size="sm" onClick={() => openScene(scenes[index + 1])}>
				{t(copy.nextScene)}
				<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
			</Button>
		) : nextLesson ? (
			<Link
				to="/learn/$lessonSlug"
				params={{ lessonSlug: nextLesson.slug }}
				search={{}}
				className={buttonVariants({ size: "sm" })}
			>
				{t(copy.nextLesson)}
				<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
			</Link>
		) : (
			<Link
				to="/courses/tradingflow-foundations"
				className={buttonVariants({ size: "sm", variant: "outline" })}
			>
				{t(copy.course)}
			</Link>
		);

	const caption =
		phase === "predict" && scene.predict
			? scene.predict.prompt
			: phase === "explore" && scene.explore
				? scene.explore.prompt
				: current.caption;
	const choice = scene.predict?.choices.find((item) => item.id === prediction);
	const panel =
		phase === "predict" && scene.predict ? (
			<div className="wt-panel" data-kind="predict">
				<p className="wt-panel-title">{t(copy.predictFirst)}</p>
				<div className="wt-choices">
					{scene.predict.choices.map((item) => (
						<Button
							key={item.id}
							variant="outline"
							className="wt-choice"
							onClick={() => choose(item.id)}
						>
							{t(item.label)}
						</Button>
					))}
				</div>
				<button
					type="button"
					className="wt-link"
					onClick={() => {
						setPhase("watch");
						record("visual_lesson_scene_started", "manual");
					}}
				>
					{t(copy.skip)}
				</button>
			</div>
		) : (
			<>
				{phase === "watch" && scene.predict && choice && beat >= revealAt ? (
					<m.div
						className="wt-panel"
						data-kind={prediction === scene.predict.answer ? "right" : "wrong"}
						initial={motion.enabled ? { opacity: 0, y: 6 } : false}
						animate={{ opacity: 1, y: 0 }}
						transition={motion.fade}
					>
						<p className="wt-panel-title">
							{prediction === scene.predict.answer
								? t(copy.right)
								: t(copy.wrong)}
						</p>
						<p className="wt-panel-note">
							{t(copy.youChose)}: {t(choice.label)}
						</p>
						<p>{t(scene.predict.explain)}</p>
					</m.div>
				) : null}
				{phase === "watch" && beat === last ? (
					<div className="wt-panel-actions">
						{scene.explore ? (
							<Button size="sm" variant="outline" onClick={startExplore}>
								{t(copy.tryIt)}
							</Button>
						) : null}
						{onward}
					</div>
				) : null}
				{phase === "explore" ? (
					<div className="wt-panel-actions">
						<Button size="sm" variant="ghost" onClick={() => goTo(last)}>
							<ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
							{t(copy.backToSteps)}
						</Button>
						{onward}
					</div>
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
			<Tabs
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
			</Tabs>
			<div className="wt-head">
				<h2 id={headingId} className="wt-title">
					{t(scene.title)}
				</h2>
				<div className="wt-caption-stack">
					<p className="wt-caption" aria-live={autoplay ? "off" : "polite"}>
						{t(caption)}
					</p>
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
					onClick={() => (phase === "explore" ? goTo(last) : goTo(beat - 1))}
					disabled={phase === "predict" || (phase === "watch" && beat === 0)}
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
					onClick={() => advance()}
					disabled={phase !== "watch" || beat === last}
				>
					{t(copy.next)}
					<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
				</Button>
			</fieldset>
			<FrameContext value={{ locale, phase, panel }}>
				<View
					locale={locale}
					phase={phase}
					beat={beat}
					state={current.state}
					explore={phase === "explore" ? explore : null}
					setExplore={(next: unknown) => {
						record("visual_lesson_explored");
						setExplore(next);
					}}
				/>
			</FrameContext>
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
	return (
		<div className="wt-scene">
			<div className="wt-main">
				<div className="wt-stage">{stage}</div>
				<div className="wt-side">
					{result?.length ? (
						<section className="wt-results" aria-label={t(copy.keyResult)}>
							<dl>
								{result.map((item) => (
									<ResultCard key={item.id} item={item} />
								))}
							</dl>
						</section>
					) : null}
					{frame?.panel}
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
		>
			<dt>{item.label}</dt>
			<dd>
				<m.span
					key={item.value}
					className="wt-result-value"
					initial={motion.enabled ? { opacity: 0.2, y: 3 } : false}
					animate={{ opacity: 1, y: 0 }}
					transition={motion.fade}
				>
					{item.value}
				</m.span>
				{item.note ? <span className="wt-result-note">{item.note}</span> : null}
			</dd>
		</div>
	);
}
