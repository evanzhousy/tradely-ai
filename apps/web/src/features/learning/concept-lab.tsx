import { Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperNav,
	StepperTitle,
	StepperTrigger,
} from "@tradely/ui/components/reui/stepper";
import { Tabs, TabsList, TabsTrigger } from "@tradely/ui/components/tabs";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CheckIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
} from "lucide-react";
import {
	type ComponentType,
	type CSSProperties,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { getLessonById, getNextLesson } from "@/content/course";
import type { Locale } from "@/i18n/messages";
import { LessonPlan } from "./lesson-plan";
import { saveVisualBookmark, useVisualBookmarks } from "./visual-bookmark";
import { VisualLessonIdentity, VisualPlayback } from "./visual-playback";
import { VisualPlaybackProgress } from "./visual-playback-progress";
import { expandSteps, type VisualStep } from "./visual-step";
export type ConceptScene = {
	id: string;
	label: readonly [string, string];
	title: readonly [string, string];
	prompt: readonly [string, string];
	steps: readonly VisualStep[];
	Component: ComponentType<{ locale: Locale }>;
};

export function ConceptLab({
	locale,
	id,
	label,
	scenes,
}: {
	locale: Locale;
	id: string;
	label: readonly [string, string];
	scenes: readonly [ConceptScene, ...ConceptScene[]];
}) {
	const lessonId = useContext(VisualLessonIdentity);
	const bookmarks = useVisualBookmarks();
	const [scene, setScene] = useState(scenes[0].id);
	const [progress, setProgress] = useState(0);
	const [epoch, setEpoch] = useState(0);
	const [resetVersion, setResetVersion] = useState(0);
	const [frames, setFrames] = useState<Record<string, number>>({});
	const [playing, setPlaying] = useState(false);
	const [complete, setComplete] = useState(false);
	const [exploring, setExploring] = useState(false);
	const [reduced, setReduced] = useState(true);
	const [ready, setReady] = useState(false);
	const restored = useRef(false);
	const autoStarted = useRef<string | null>(null);
	const [visible, setVisible] = useState(false);
	const [pageVisible, setPageVisible] = useState(true);
	const stage = useRef<HTMLDivElement>(null);
	const titleId = useId();
	const index = Math.max(
		0,
		scenes.findIndex((item) => item.id === scene),
	);
	const active = scenes[index];
	const registerFrames = useCallback(
		(id: string, count: number) => {
			const key = `${scene}:${id}`;
			setFrames((previous) =>
				previous[key] === count ? previous : { ...previous, [key]: count },
			);
			return () =>
				setFrames((previous) => {
					const next = { ...previous };
					delete next[key];
					return next;
				});
		},
		[scene],
	);
	const steps = useMemo(
		() =>
			expandSteps(
				active.steps,
				Object.entries(frames)
					.filter(([key]) => key.startsWith(`${scene}:`))
					.map(([, count]) => count),
			),
		[active.steps, frames, scene],
	);
	const language = locale === "zh" ? 1 : 0;
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const pause = useCallback(() => {
		autoStarted.current = scene;
		setPlaying(false);
	}, [scene]);
	const seek = useCallback((value: number) => {
		setComplete(false);
		setExploring(false);
		setProgress(Math.max(0, Math.min(1, value)));
		setEpoch((value) => value + 1);
	}, []);
	const stepCount = steps.length;
	const step =
		steps.reduce(
			(closest, item, i) =>
				Math.abs(item.state.position - progress) <
				Math.abs(steps[closest].state.position - progress)
					? i
					: closest,
			0,
		) + 1;
	const currentStep = steps[step - 1];
	const selectStep = (value: number) => {
		autoStarted.current = scene;
		seek(steps[Math.max(0, Math.min(stepCount - 1, value - 1))].state.position);
		setPlaying(!reduced);
	};
	const toggle = () => {
		if (reduced) {
			if (exploring) {
				setResetVersion((value) => value + 1);
				selectStep(1);
				return;
			}
			selectStep(step >= stepCount ? 1 : step + 1);
			return;
		}
		if (playing) pause();
		else {
			autoStarted.current = scene;
			if (exploring || complete) {
				setResetVersion((value) => value + 1);
				seek(0);
			}
			setPlaying(true);
		}
	};
	const selectScene = (value: string) => {
		if (value === scene) return;
		pause();
		setVisible(false);
		seek(0);
		setScene(value);
		if (lessonId) saveVisualBookmark(lessonId, value);
	};
	useEffect(() => {
		if (restored.current || !lessonId) return;
		restored.current = true;
		const saved = bookmarks[lessonId];
		if (saved && scenes.some((item) => item.id === saved)) setScene(saved);
		else saveVisualBookmark(lessonId, scenes[0].id);
	}, [bookmarks, lessonId, scenes]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Reconnect visibility observation when the active scene remounts.
	useEffect(() => {
		setReady(true);
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => {
			setReduced(preference.matches);
			if (preference.matches) setPlaying(false);
		};
		update();
		preference.addEventListener("change", update);
		const onHide = () => {
			setPageVisible(!document.hidden);
			if (document.hidden) setPlaying(false);
		};
		onHide();
		document.addEventListener("visibilitychange", onHide);
		const observer = new IntersectionObserver(([entry]) => {
			if (!stage.current?.contains(entry.target)) return;
			setVisible(entry.isIntersecting);
			if (!entry.isIntersecting) setPlaying(false);
		});
		const diagram =
			stage.current?.querySelector(".visual-scene-layout") ?? stage.current;
		if (diagram) observer.observe(diagram);
		return () => {
			preference.removeEventListener("change", update);
			document.removeEventListener("visibilitychange", onHide);
			observer.disconnect();
		};
	}, [pause, scene, resetVersion]);
	const advance = useCallback(() => {
		if (step >= stepCount) {
			setComplete(true);
			pause();
		} else seek(steps[step].state.position);
	}, [pause, seek, step, stepCount, steps]);
	useEffect(() => {
		if (
			ready &&
			visible &&
			pageVisible &&
			!reduced &&
			autoStarted.current !== scene
		) {
			autoStarted.current = scene;
			setPlaying(true);
		}
	}, [ready, reduced, visible, pageVisible, scene]);
	const caption = exploring ? active.prompt : currentStep.caption;
	const Component = active.Component;
	const lesson = lessonId ? getLessonById(lessonId) : undefined;
	const nextLesson = lesson ? getNextLesson(lesson.slug) : undefined;
	const continuation =
		index < scenes.length - 1 ? (
			<Button
				variant={complete ? "default" : "outline"}
				size="sm"
				onClick={() => selectScene(scenes[index + 1].id)}
			>
				{l("Next scene", "下一场景")}
				<ArrowRightIcon data-icon="inline-end" />
			</Button>
		) : nextLesson ? (
			<Link
				to="/learn/$lessonSlug"
				params={{ lessonSlug: nextLesson.slug }}
				search={{}}
				className={buttonVariants({
					variant: complete ? "default" : "outline",
					size: "sm",
				})}
			>
				{l("Next lesson", "下一课")}
				<ArrowRightIcon data-icon="inline-end" />
			</Link>
		) : lesson ? (
			<Link
				to="/courses/tradingflow-foundations"
				className={buttonVariants({ variant: "outline", size: "sm" })}
			>
				{l("Back to the course", "回到课程")}
			</Link>
		) : null;
	return (
		<section
			className="concept-lab visual-classroom"
			aria-label={label[language]}
			data-concept-lab={id}
			data-visual-lesson={lessonId}
			data-visual-ready={ready}
			data-playback-progress={progress}
			data-playing={playing}
			data-scene-id={active.id}
			data-mode={exploring ? "explore" : "walkthrough"}
			data-focus={currentStep.focus}
			data-contract-lab={id === "contracts" ? "" : undefined}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Badge variant="outline">{l("Visual lesson", "视觉课堂")}</Badge>
				<span className="text-muted-foreground text-xs">
					{l("Watch · Explore · Understand", "观看 · 探索 · 理解")}
				</span>
			</div>
			<Tabs value={scene} onValueChange={(value) => selectScene(String(value))}>
				<TabsList
					className="contract-scene-tabs"
					style={{ "--scene-columns": scenes.length } as CSSProperties}
					aria-label={l("Lesson scenes", "课程场景")}
				>
					{scenes.map((item, i) => (
						<TabsTrigger key={item.id} value={item.id} aria-controls={titleId}>
							<span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
							{item.label[language]}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<div ref={stage} className="visual-stage" id={titleId}>
				<div className="flex flex-col gap-3">
					<h2 className="font-semibold text-2xl tracking-tight sm:text-3xl">
						{active.title[language]}
					</h2>
					<div className="visual-caption-stack">
						<p
							className="visual-caption"
							aria-live={playing ? "off" : "polite"}
						>
							{caption[language]}
						</p>
						<p
							className="visual-caption visual-caption-reserve"
							aria-hidden="true"
						>
							{active.prompt[language]}
						</p>
						{steps.map((item) => (
							<p
								key={item.id}
								className="visual-caption visual-caption-reserve"
								aria-hidden="true"
							>
								{item.caption[language]}
							</p>
						))}
					</div>
				</div>
				<fieldset
					className="visual-playback"
					aria-label={l("Demonstration controls", "演示控制")}
				>
					<Button
						size="sm"
						variant="secondary"
						onClick={toggle}
						aria-pressed={playing}
					>
						{playing ? (
							<PauseIcon data-icon="inline-start" />
						) : (
							<PlayIcon data-icon="inline-start" />
						)}
						{playing
							? l("Pause", "暂停")
							: exploring
								? l("Return to lesson", "返回讲解")
								: reduced
									? l("Next step", "下一步")
									: complete
										? l("Start again", "重新开始")
										: l("Continue explanation", "继续讲解")}
					</Button>
					<Stepper
						key={scene}
						value={step}
						onValueChange={selectStep}
						className="visual-stepper"
						indicators={{
							completed: <CheckIcon className="size-3.5" aria-hidden="true" />,
						}}
						aria-label={l("Explanation steps", "讲解步骤")}
					>
						<StepperNav>
							{steps.map((item, i) => (
								<StepperItem
									key={i}
									step={i + 1}
									completed={i + 1 < step || (complete && i + 1 === step)}
								>
									<StepperTrigger
										id={`${titleId}-step-${i + 1}`}
										aria-controls={`${titleId}-scene`}
										aria-label={`${i + 1}. ${item.label[language]}`}
									>
										<StepperIndicator>{i + 1}</StepperIndicator>
										<StepperTitle className="text-center text-xs leading-tight">
											{item.label[language]}
										</StepperTitle>
									</StepperTrigger>
									{i + 1 === step && (
										<VisualPlaybackProgress
											key={`${scene}:${epoch}`}
											locale={locale}
											currentStep={currentStep}
											step={step}
											running={playing && ready && visible && pageVisible}
											exploring={exploring}
											reduced={reduced}
											complete={complete}
											onElapsed={advance}
										/>
									)}
								</StepperItem>
							))}
						</StepperNav>
					</Stepper>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							autoStarted.current = scene;
							seek(0);
							setResetVersion((value) => value + 1);
							setPlaying(!reduced);
						}}
						aria-label={l("Reset demonstration", "重置演示")}
					>
						<RotateCcwIcon />
						{l("Restart", "重启")}
					</Button>
					{complete && !exploring && (
						<div className="visual-playback-complete">
							<span role="status">
								{l("Explanation complete", "本段讲解完成")}
							</span>
							{continuation}
						</div>
					)}
				</fieldset>
				<VisualPlayback
					value={{
						progress,
						step: currentStep,
						registerFrames,
						epoch,
						playing,
						pause,
						seek,
						toggle,
						start: () => {
							autoStarted.current = scene;
							seek(0);
							setPlaying(!reduced);
						},
					}}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Delegated events from native interactive descendants; this wrapper is not a control. */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Native controls emit click on keyboard activation; capture pauses keyboard exploration. */}
					<div
						id={`${titleId}-scene`}
						key={`${scene}:${resetVersion}`}
						onPointerDownCapture={() => {
							pause();
						}}
						onKeyDownCapture={() => {
							pause();
						}}
						onClick={(event) => {
							if ((event.target as Element).closest("[data-lesson-action]"))
								return;
							setExploring(true);
						}}
						onChangeCapture={() => {
							pause();
							setExploring(true);
						}}
					>
						<Component locale={locale} />
					</div>
				</VisualPlayback>
				<LessonPlan
					locale={locale}
					steps={steps}
					step={step}
					running={playing && ready && visible && pageVisible}
					exploring={exploring}
					reduced={reduced}
					complete={complete}
					epoch={epoch}
				/>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
				<Button
					variant="ghost"
					size="sm"
					disabled={index === 0}
					onClick={() => selectScene(scenes[index - 1].id)}
				>
					<ArrowLeftIcon data-icon="inline-start" />
					{l("Previous scene", "上一场景")}
				</Button>
				{continuation}
			</div>
			<p className="text-muted-foreground text-xs">
				{l(
					"Illustrative examples · Explore at your own pace. Your last scene is remembered on this device.",
					"教学示例 · 按自己的节奏探索。本设备会记住上次查看的场景。",
				)}
			</p>
		</section>
	);
}
