import { Badge } from "@tradely/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { useEffect, useRef, useState } from "react";
import {
	type FlowStructureComparison,
	reportedOiChange,
	sampleSessionVolume,
} from "@/domain/learning/flow-structure";
import { replayTime } from "@/domain/learning/replay";
import type { LearningCopy } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ReplayControls } from "./replay-controls";
import { useLearningReplay } from "./use-learning-replay";

const copy = {
	title: { en: "One session. Different clocks.", zh: "同一时段，不同时钟。" },
	flow: { en: "Session volume", zh: "时段成交量" },
	contracts: { en: "contracts traded", zh: "张成交合约" },
	chart: { en: "Cumulative session volume", zh: "时段累计成交量" },
	scale: { en: "Volume scale", zh: "成交量刻度" },
	active: { en: "Session tape", zh: "时段成交记录" },
	date: { en: "As of", zh: "截至" },
	currentOi: { en: "Reported open interest", zh: "报告持仓量" },
	oiNote: {
		en: "Latest supplied cleared report. Its date stays fixed as the tape moves.",
		zh: "最近提供的清算报告中的未平仓合约。成交回放推进时，此日期保持不变。",
	},
	delta: { en: "Change between reports", zh: "报告间变化" },
	noDelta: { en: "No comparable report pair", zh: "没有可比报告对" },
	priorScope: { en: "Earlier report scope", zh: "较早报告范围" },
	gex: { en: "Modeled GEX snapshot", zh: "GEX 模型快照" },
	gexUnits: {
		en: "million USD per 1% underlying move · illustrative model",
		zh: "百万美元／标的每变化 1% · 示例模型",
	},
	gexNote: {
		en: "Fixed model snapshot with assumed position signs; not an observation of live dealer trades.",
		zh: "采用假设持仓方向的带日期模型。本例快照保持固定，不代表实时做市商成交观测。",
	},
	missing: { en: "Not supplied", zh: "未提供" },
	fixed: { en: "Dated snapshot", zh: "带日期快照" },
} satisfies Record<string, LearningCopy>;

/** The dataset is immutable; the parent keys by attempt, stage and dataset ID. */
export function FlowStructureExplorer({
	data: initialData,
	locale,
	autoPlay = true,
}: {
	data: FlowStructureComparison;
	locale: Locale;
	autoPlay?: boolean;
}) {
	const [data] = useState(initialData);
	const host = useRef<HTMLElement>(null);
	const didAutoplay = useRef(false);
	const playback = useLearningReplay(data, host, autoPlay ? 0 : 1);
	const { clock, position, visible, reducedMotion, play } = playback;
	useEffect(() => {
		if (
			autoPlay &&
			visible &&
			!reducedMotion &&
			!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches &&
			!didAutoplay.current
		) {
			didAutoplay.current = true;
			play();
		}
	}, [autoPlay, visible, reducedMotion, play]);
	const text = (key: keyof typeof copy) => copy[key][locale];
	const format = (value: number | null, signed = false) =>
		value === null
			? "—"
			: new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
					maximumFractionDigits: 1,
					signDisplay: signed ? "exceptZero" : "auto",
				}).format(value);
	const volume = sampleSessionVolume(data, position);
	const change = reportedOiChange(data);
	const max = Math.max(1, ...data.replay.frames.map((frame) => frame.volume));
	const point = (at: number, value: number) =>
		`${20 + at * 600},${185 - (value / max) * 160}`;
	const trail = [
		...data.replay.frames.filter((frame) => frame.position < position),
		{ position, volume },
	];
	return (
		<section
			ref={host}
			id="flow-structure"
			className="flex scroll-mt-24 flex-col gap-5"
			aria-label={text("title")}
		>
			<div className="flex flex-col gap-2">
				<h4 className="font-medium text-lg">{text("title")}</h4>
				<p className="text-muted-foreground text-sm">{data.scope}</p>
			</div>
			<ReplayControls
				data={data}
				note={data.note}
				locale={locale}
				{...playback}
				play={() => {
					didAutoplay.current = true;
					playback.play();
				}}
				pause={() => {
					didAutoplay.current = true;
					playback.pause();
				}}
				seek={(at) => {
					didAutoplay.current = true;
					playback.seek(at);
				}}
			/>
			<div className="grid items-start gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<CardTitle>{text("flow")}</CardTitle>
							<Badge>{text("active")}</Badge>
						</div>
						<CardDescription>
							{data.sessionDate} · {replayTime(data, position)} ET
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							aria-live={clock.playing ? "off" : "polite"}
							className="flex flex-wrap items-baseline gap-2"
						>
							<strong
								className="font-mono text-4xl tabular-nums"
								data-flow-volume
							>
								{format(volume)}
							</strong>
							<span className="text-muted-foreground text-sm">
								{text("contracts")}
							</span>
						</div>
						<p className="mt-3 font-mono text-muted-foreground text-xs">
							{text("scale")}: 0–{format(max)}
						</p>
						<svg
							viewBox="0 0 640 210"
							className="w-full text-chart-1"
							role="img"
							aria-label={text("chart")}
						>
							<title>{text("chart")}</title>
							<path
								d="M20,25 V185 H620"
								fill="none"
								stroke="currentColor"
								className="text-border"
							/>
							<polyline
								points={trail
									.map((frame) => point(frame.position, frame.volume))
									.join(" ")}
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinejoin="round"
							/>
							<circle
								cx={20 + position * 600}
								cy={185 - (volume / max) * 160}
								r="5"
								fill="currentColor"
							/>
						</svg>
						<div className="flex justify-between font-mono text-muted-foreground text-xs">
							<span>09:30 ET</span>
							<span>16:00 ET</span>
						</div>
					</CardContent>
				</Card>
				<div className="grid gap-4">
					<Card size="sm">
						<CardHeader>
							<Badge variant="secondary">{text("fixed")}</Badge>
							<CardTitle>{text("currentOi")}</CardTitle>
							<CardDescription>
								{text("date")} {data.reportedOi.asOf}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<strong className="font-mono text-3xl tabular-nums" data-flow-oi>
								{format(data.reportedOi.value)}
							</strong>
							<p className="text-muted-foreground text-xs">{text("oiNote")}</p>
							<div className="rounded-xl bg-muted p-3">
								<p className="text-muted-foreground text-xs">{text("delta")}</p>
								<p className="font-mono text-lg tabular-nums" data-flow-delta>
									{format(change, true)}
								</p>
								<p className="text-muted-foreground text-xs">
									{change === null
										? text("noDelta")
										: `${data.previousOi?.asOf} → ${data.reportedOi.asOf}`}
								</p>
							</div>
							{data.previousOi &&
							data.previousOi.scope !== data.reportedOi.scope ? (
								<p className="text-muted-foreground text-xs">
									{text("priorScope")}: {data.previousOi.scope}
								</p>
							) : null}
						</CardContent>
					</Card>
					<Card size="sm">
						<CardHeader>
							<Badge variant="secondary">{text("fixed")}</Badge>
							<CardTitle>{text("gex")}</CardTitle>
							<CardDescription>
								{text("date")} {data.gex.asOf}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<strong className="font-mono text-3xl tabular-nums" data-flow-gex>
								{format(data.gex.value, true)}
							</strong>
							<p className="text-muted-foreground text-xs">
								{data.gex.value === null ? text("missing") : text("gexUnits")}
							</p>
							<p className="text-muted-foreground text-xs">{text("gexNote")}</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
