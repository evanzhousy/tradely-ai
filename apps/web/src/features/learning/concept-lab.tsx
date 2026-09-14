import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@tradely/ui/components/tabs";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
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
	useRef,
	useState,
} from "react";
import type { Locale } from "@/i18n/messages";
import { saveVisualBookmark, useVisualBookmarks } from "./visual-bookmark";
import { VisualLessonIdentity, VisualPlayback } from "./visual-playback";
export type ConceptScene = {
	id: string;
	label: readonly [string, string];
	title: readonly [string, string];
	prompt: readonly [string, string];
	demonstration?: readonly (readonly [string, string])[];
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
	const [playing, setPlaying] = useState(false);
	const [exploring, setExploring] = useState(false);
	const [reduced, setReduced] = useState(true);
	const [ready, setReady] = useState(false);
	const restored = useRef(false);
	const stage = useRef<HTMLDivElement>(null);
	const timelineId = useId();
	const titleId = useId();
	const index = Math.max(
		0,
		scenes.findIndex((item) => item.id === scene),
	);
	const active = scenes[index];
	const language = locale === "zh" ? 1 : 0;
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const pause = useCallback(() => setPlaying(false), []);
	const seek = useCallback((value: number) => {
		setExploring(false);
		setProgress(Math.max(0, Math.min(1, value)));
		setEpoch((value) => value + 1);
	}, []);
	const toggle = () => {
		if (playing) pause();
		else {
			seek(progress === 1 ? 0 : progress);
			setPlaying(true);
		}
	};
	const selectScene = (value: string) => {
		pause();
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
			if (preference.matches) pause();
		};
		update();
		preference.addEventListener("change", update);
		const onHide = () => {
			if (document.hidden) pause();
		};
		document.addEventListener("visibilitychange", onHide);
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) pause();
		});
		const diagram =
			stage.current?.querySelector(".contract-stage") ?? stage.current;
		if (diagram) observer.observe(diagram);
		return () => {
			preference.removeEventListener("change", update);
			document.removeEventListener("visibilitychange", onHide);
			observer.disconnect();
		};
	}, [pause, scene]);
	useEffect(() => {
		if (!playing || reduced) return;
		const timer = window.setTimeout(() => {
			if (progress >= 1) pause();
			else seek(Math.min(1, Math.round((progress + 0.1) * 10) / 10));
		}, 2200);
		return () => window.clearTimeout(timer);
	}, [playing, progress, reduced, pause, seek]);
	const beats = active.demonstration ?? [
		active.title,
		active.prompt,
		active.title,
	];
	const caption = exploring
		? active.prompt
		: beats[Math.round(progress * (beats.length - 1))];
	const Component = active.Component;
	return (
		<section
			className="concept-lab visual-classroom"
			aria-label={label[language]}
			data-concept-lab={id}
			data-visual-lesson={lessonId}
			data-visual-ready={ready}
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
					<p className="visual-caption" aria-live={playing ? "off" : "polite"}>
						{caption[language]}
					</p>
				</div>
				<fieldset
					className="visual-playback"
					aria-label={l("Demonstration controls", "演示控制")}
				>
					{reduced ? (
						<Badge variant="secondary">
							{l("Step-by-step view", "逐步查看")}
						</Badge>
					) : (
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
								: progress === 1
									? l("Replay", "重播")
									: l("Watch explanation", "观看演示")}
						</Button>
					)}
					<label htmlFor={timelineId} className="sr-only">
						{l("Explanation timeline", "讲解时间轴")}
					</label>
					<input
						id={timelineId}
						type="range"
						min="0"
						max="100"
						step="1"
						value={Math.round(progress * 100)}
						onChange={(event) => {
							pause();
							seek(Number(event.target.value) / 100);
						}}
						aria-valuetext={caption[language]}
						className="visual-timeline"
					/>
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => {
							pause();
							seek(0);
						}}
						aria-label={l("Reset demonstration", "重置演示")}
					>
						<RotateCcwIcon />
					</Button>
				</fieldset>
				<VisualPlayback
					value={{ progress, epoch, playing, pause, seek, toggle }}
				>
					<div
						key={scene}
						onPointerDownCapture={() => {
							pause();
							setExploring(true);
						}}
						onKeyDownCapture={() => {
							pause();
							setExploring(true);
						}}
					>
						<Component locale={locale} />
					</div>
				</VisualPlayback>
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
				{index < scenes.length - 1 ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => selectScene(scenes[index + 1].id)}
					>
						{l("Next scene", "下一场景")}
						<ArrowRightIcon data-icon="inline-end" />
					</Button>
				) : (
					<span className="text-muted-foreground text-sm">
						{l(
							"Explore again or continue to the next lesson below.",
							"可以再次探索，或继续下方的下一课。",
						)}
					</span>
				)}
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
