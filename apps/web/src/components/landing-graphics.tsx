import { cn } from "@tradely/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
	AppWindowIcon,
	BookmarkCheckIcon,
	BookOpenCheckIcon,
	CreditCardIcon,
	LayoutGridIcon,
	ListOrderedIcon,
	ScanSearchIcon,
	SquarePlayIcon,
	UserRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { categoryLabel, t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

import { StageIcon } from "./course-marks";

function DiagramFrame({
	caption,
	children,
	className,
}: {
	caption: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<figure
			className={cn(
				"overflow-hidden rounded-4xl bg-card px-4 py-6 shadow-md ring-1 ring-foreground/8 sm:px-8 sm:py-8 dark:ring-foreground/12",
				className,
			)}
		>
			<figcaption className="mb-6 font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
				{caption}
			</figcaption>
			{children}
		</figure>
	);
}

function MarkSvg({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn("size-6", className)}
			aria-hidden
			focusable="false"
		>
			<title>Research stage mark</title>
			{children}
		</svg>
	);
}

const researchMarks = {
	discover: (
		<MarkSvg>
			<circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
			<circle cx="12" cy="12" r="6.25" />
			<circle cx="12" cy="12" r="10" strokeDasharray="2.4 2.8" />
		</MarkSvg>
	),
	inspect: (
		<MarkSvg>
			<circle cx="10.5" cy="10.5" r="6.25" />
			<path d="m15.2 15.2 6.3 6.3" />
		</MarkSvg>
	),
	validate: (
		<MarkSvg>
			<rect x="4" y="4" width="16" height="16" rx="2" />
			<path d="m8 12.2 2.8 2.8L16.5 9" />
		</MarkSvg>
	),
	freshness: (
		<MarkSvg>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7.5V12l3.4 2" />
		</MarkSvg>
	),
	unknown: (
		<MarkSvg>
			<circle cx="12" cy="12" r="9" strokeDasharray="3 3.25" />
			<path d="M9.6 9.4a2.5 2.5 0 1 1 2.7 3.9" />
			<circle cx="12" cy="16.6" r="0.85" fill="currentColor" stroke="none" />
		</MarkSvg>
	),
} as const;

const workflowStages = [
	{ n: "01", labelKey: "stageDiscover", mark: "discover" },
	{ n: "02", labelKey: "stageInspect", mark: "inspect" },
	{ n: "03", labelKey: "stageValidate", mark: "validate" },
	{ n: "04", labelKey: "stageFreshness", mark: "freshness" },
	{ n: "05", labelKey: "stageUnknown", mark: "unknown" },
] as const;

export function IntersectMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 40 24"
			className={cn("h-5 w-9 text-primary/50", className)}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
			aria-hidden
			focusable="false"
		>
			<title>Overlapping products</title>
			<circle cx="14" cy="12" r="8.5" />
			<circle cx="26" cy="12" r="8.5" />
		</svg>
	);
}

export function WorkflowPath() {
	const locale = useLocale();
	return (
		<DiagramFrame caption={t(locale, "evidenceLoop")}>
			<div className="relative">
				<div
					className="absolute top-7 right-[10%] left-[10%] hidden h-px bg-border sm:block"
					aria-hidden
				/>
				<ol className="relative flex flex-col gap-5 sm:grid sm:grid-cols-5 sm:gap-0">
					{workflowStages.map((stage) => (
						<li key={stage.n} className="flex sm:flex-col sm:items-center">
							<div className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center">
								<span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-primary ring-1 ring-foreground/8 dark:ring-foreground/12">
									{researchMarks[stage.mark]}
								</span>
								<span className="flex flex-col gap-0.5">
									<span className="font-mono text-[11px] text-muted-foreground">
										{stage.n}
									</span>
									<span className="font-medium text-sm">
										{t(locale, stage.labelKey)}
									</span>
								</span>
							</div>
						</li>
					))}
				</ol>
			</div>
		</DiagramFrame>
	);
}

const hubSteps = [
	{
		n: "01",
		titleKey: "hubWatchTitle",
		bodyKey: "hubWatchBody",
		icon: SquarePlayIcon,
	},
	{
		n: "02",
		titleKey: "hubPracticeTitle",
		bodyKey: "hubPracticeBody",
		icon: AppWindowIcon,
	},
	{
		n: "03",
		titleKey: "hubRecordTitle",
		bodyKey: "hubRecordBody",
		icon: BookmarkCheckIcon,
	},
] as const;

export function HubLoop() {
	const locale = useLocale();
	return (
		<ol className="grid gap-4 sm:grid-cols-3 sm:gap-6">
			{hubSteps.map((step) => {
				const Icon = step.icon;
				return (
					<li
						key={step.n}
						className="flex flex-col gap-4 rounded-4xl bg-card p-5 shadow-md ring-1 ring-foreground/8 dark:ring-foreground/12"
					>
						<div className="flex items-center gap-3">
							<span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
								<Icon className="size-5" aria-hidden />
							</span>
							<span className="font-mono text-[11px] text-muted-foreground">
								{step.n}
							</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<h3 className="font-medium text-base">
								{t(locale, step.titleKey)}
							</h3>
							<p className="text-muted-foreground text-sm leading-6">
								{t(locale, step.bodyKey)}
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

function SplitArrow() {
	return (
		<svg
			viewBox="0 0 72 56"
			className="h-14 w-16 text-primary/70 max-lg:rotate-90"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.35"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
			focusable="false"
		>
			<title>Practice and resume</title>
			<path d="M8 16h44" />
			<path d="m44 9 12 7-12 7" />
			<path d="M64 40H20" />
			<path d="m28 33-12 7 12 7" />
		</svg>
	);
}

export function ProductSplit() {
	const locale = useLocale();
	return (
		<DiagramFrame caption={t(locale, "splitCaption")}>
			<div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
				<div className="flex flex-col gap-4 rounded-3xl bg-muted/70 p-5">
					<div className="flex items-center gap-2 text-primary">
						<BookOpenCheckIcon className="size-5" aria-hidden />
						<span className="font-medium text-foreground text-sm">Tradely</span>
					</div>
					<ul className="flex flex-col gap-2.5 text-muted-foreground text-sm">
						<li className="flex items-center gap-2">
							<ListOrderedIcon className="size-3.5 text-primary" aria-hidden />
							{t(locale, "splitCurriculum")}
						</li>
						<li className="flex items-center gap-2">
							<BookmarkCheckIcon
								className="size-3.5 text-primary"
								aria-hidden
							/>
							{t(locale, "splitProgress")}
						</li>
						<li className="flex items-center gap-2">
							<CreditCardIcon className="size-3.5 text-primary" aria-hidden />
							{t(locale, "splitMembership")}
						</li>
					</ul>
				</div>
				<div className="flex flex-col items-center gap-1">
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
						{t(locale, "splitPractice")}
					</span>
					<SplitArrow />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
						{t(locale, "splitResume")}
					</span>
				</div>
				<div className="flex flex-col gap-4 rounded-3xl bg-muted/70 p-5">
					<div className="flex items-center gap-2 text-primary">
						<LayoutGridIcon className="size-5" aria-hidden />
						<span className="font-medium text-foreground text-sm">
							TradingFlow
						</span>
					</div>
					<ul className="flex flex-col gap-2.5 text-muted-foreground text-sm">
						<li className="flex items-center gap-2">
							<AppWindowIcon className="size-3.5 text-primary" aria-hidden />
							{t(locale, "splitLiveTool")}
						</li>
						<li className="flex items-center gap-2">
							<ScanSearchIcon className="size-3.5 text-primary" aria-hidden />
							{t(locale, "splitSurfaces")}
						</li>
						<li className="flex items-center gap-2">
							<UserRoundIcon className="size-3.5 text-primary" aria-hidden />
							{t(locale, "splitSeparateAccount")}
						</li>
					</ul>
				</div>
			</div>
		</DiagramFrame>
	);
}

export function HeroStats({
	lessonCount,
	previewCount,
}: {
	lessonCount: number;
	previewCount: number;
}) {
	const locale = useLocale();
	const stats: { icon: LucideIcon; label: string }[] = [
		{
			icon: BookOpenCheckIcon,
			label: t(locale, "statLessons", { n: lessonCount }),
		},
		{ icon: SquarePlayIcon, label: t(locale, "statFree", { n: previewCount }) },
		{ icon: AppWindowIcon, label: t(locale, "statPractice") },
	];
	return (
		<ul className="flex flex-wrap gap-2">
			{stats.map((stat) => {
				const Icon = stat.icon;
				return (
					<li
						key={stat.label}
						className="inline-flex items-center gap-2 rounded-4xl bg-muted px-3 py-1.5"
					>
						<Icon className="size-3.5 text-primary" aria-hidden />
						<span className="font-mono text-muted-foreground text-xs">
							{stat.label}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

export function StageLegend({
	groups,
}: {
	groups: readonly {
		category: string;
		lessons: readonly { order: number }[];
	}[];
}) {
	const locale = useLocale();
	return (
		<ol className="relative flex flex-col gap-2 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-foreground/12">
			{groups.map((group) => {
				const first = group.lessons[0];
				const last = group.lessons.at(-1);
				if (!first || !last) return null;
				const start = String(first.order + 1).padStart(2, "0");
				const end = String(last.order + 1).padStart(2, "0");
				return (
					<li key={group.category} className="flex items-center gap-3 text-sm">
						<span className="flex size-8 items-center justify-center rounded-full bg-muted text-primary">
							<StageIcon category={group.category} className="size-3.5" />
						</span>
						<span className="font-medium">
							{categoryLabel(locale, group.category)}
						</span>
						<span className="ml-auto font-mono text-muted-foreground text-xs">
							{start === end ? start : `${start}–${end}`}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
