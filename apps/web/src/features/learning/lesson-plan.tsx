"use client";

import { cn } from "@tradely/ui/lib/utils";
import { Check, ListTodo } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/messages";
import type { VisualStep } from "./visual-step";

type LessonPlanStatus = "pending" | "in-progress" | "completed";

type PlanGroup = {
	key: string;
	label: VisualStep["label"];
	start: number;
	end: number;
};

function groupPlanSteps(steps: readonly VisualStep[]): PlanGroup[] {
	const groups: PlanGroup[] = [];
	steps.forEach((item, index) => {
		const previous = groups.at(-1);
		if (
			previous &&
			previous.label[0] === item.label[0] &&
			previous.label[1] === item.label[1]
		) {
			previous.end = index + 1;
			return;
		}
		groups.push({
			key: `${item.id}-${index}`,
			label: item.label,
			start: index + 1,
			end: index + 1,
		});
	});
	return groups;
}

function statusLabel(status: LessonPlanStatus, locale: Locale) {
	if (locale === "zh") {
		return status === "completed"
			? "已完成"
			: status === "in-progress"
				? "进行中"
				: "待开始";
	}
	return status === "completed"
		? "Completed"
		: status === "in-progress"
			? "In progress"
			: "Pending";
}

function StatusIcon({
	status,
	progress,
}: {
	status: LessonPlanStatus;
	progress?: number;
}) {
	const reduce = useReducedMotion() ?? false;
	const normalized = Math.min(100, Math.max(0, progress ?? 0)) / 100;
	if (status === "completed") {
		return (
			<span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
				<Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
			</span>
		);
	}
	if (status === "in-progress") {
		return (
			<m.svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				className="size-5 shrink-0 text-foreground"
			>
				<circle
					cx="12"
					cy="12"
					r="9"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="opacity-15"
				/>
				<m.circle
					cx="12"
					cy="12"
					r="9"
					pathLength="1"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					initial={false}
					animate={{ pathLength: normalized, rotate: -90 }}
					transition={reduce ? { duration: 0 } : { duration: 0.18 }}
					style={{ transformOrigin: "12px 12px" }}
				/>
			</m.svg>
		);
	}
	return (
		<span className="grid size-5 shrink-0 place-items-center text-muted-foreground/50">
			<span
				className="size-2 rounded-full border border-current"
				aria-hidden="true"
			/>
		</span>
	);
}

function usePlanProgress({
	epoch,
	holdMs,
	running,
	reduced,
	exploring,
	complete,
	onElapsed,
}: {
	epoch: number;
	holdMs: number;
	running: boolean;
	reduced: boolean;
	exploring: boolean;
	complete: boolean;
	onElapsed: () => void;
}) {
	const elapsed = useRef(0);
	const [displayElapsed, setDisplayElapsed] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: epoch and duration intentionally reset the timer after a lesson seek.
	useEffect(() => {
		elapsed.current = 0;
		setDisplayElapsed(0);
	}, [epoch, holdMs]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: epoch restarts timing when seeking to the same-duration step.
	useEffect(() => {
		if (!running || reduced || exploring || complete) return;
		const started = performance.now();
		const previous = elapsed.current;
		let finished = false;
		const tick = () => {
			elapsed.current = Math.min(
				holdMs,
				previous + performance.now() - started,
			);
			setDisplayElapsed(elapsed.current);
			if (elapsed.current >= holdMs && !finished) {
				finished = true;
				onElapsed();
			}
		};
		const timer = window.setInterval(tick, 100);
		return () => {
			window.clearInterval(timer);
			elapsed.current = Math.min(
				holdMs,
				previous + performance.now() - started,
			);
			setDisplayElapsed(elapsed.current);
		};
	}, [complete, epoch, exploring, holdMs, onElapsed, reduced, running]);
	const value = complete ? holdMs : Math.min(holdMs, displayElapsed);
	return holdMs > 0 ? Math.min(100, (value / holdMs) * 100) : 0;
}

export function LessonPlan({
	locale,
	steps,
	step,
	running,
	exploring,
	reduced,
	complete,
	epoch,
	onElapsed,
	onStepSelect,
}: {
	locale: Locale;
	steps: readonly VisualStep[];
	step: number;
	running: boolean;
	exploring: boolean;
	reduced: boolean;
	complete: boolean;
	epoch: number;
	onElapsed: () => void;
	onStepSelect: (step: number) => void;
}) {
	const reduce = useReducedMotion() ?? false;
	const language = locale === "zh" ? 1 : 0;
	const current = steps[Math.max(0, step - 1)] ?? steps[0];
	const plan = groupPlanSteps(steps);
	const progress = usePlanProgress({
		epoch,
		holdMs: current?.holdMs ?? 0,
		running,
		reduced,
		exploring,
		complete,
		onElapsed,
	});
	const completed = complete
		? plan.length
		: plan.filter((item) => item.end < step).length;
	const title = locale === "zh" ? "本段步骤" : "Lesson plan";

	return (
		<section
			aria-label={title}
			className="visual-lesson-plan w-full overflow-hidden rounded-2xl border border-border/70 bg-background/50"
		>
			<div className="flex min-h-11 items-center gap-2.5 px-3.5 text-left">
				<span
					aria-hidden="true"
					className="grid size-6 shrink-0 place-items-center text-muted-foreground"
				>
					{completed === plan.length ? (
						<Check className="size-4 text-emerald-500" strokeWidth={2.5} />
					) : (
						<ListTodo className="size-4" />
					)}
				</span>
				<h3 className="min-w-0 flex-1 truncate font-medium text-foreground/90 text-sm">
					{title}
				</h3>
				<span className="shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
					<span className="sr-only">
						{completed} {locale === "zh" ? "步已完成，共" : "of"} {plan.length}
						{locale === "zh" ? "步" : "steps completed"}
					</span>
					<span aria-hidden="true">
						{completed}/{plan.length}
					</span>
				</span>
			</div>
			<ol aria-live="polite" className="space-y-0 px-2 pb-2">
				{plan.map((item) => {
					const status: LessonPlanStatus =
						complete || item.end < step
							? "completed"
							: step >= item.start && step <= item.end
								? "in-progress"
								: "pending";
					return (
						<m.li
							layout="position"
							key={item.key}
							initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={reduce ? { duration: 0 } : { duration: 0.18 }}
							className="rounded-xl"
						>
							<button
								type="button"
								onClick={() => onStepSelect(item.start)}
								aria-current={status === "in-progress" ? "step" : undefined}
								className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							>
								<StatusIcon
									status={status}
									progress={status === "in-progress" ? progress : undefined}
								/>
								<span className="sr-only">{statusLabel(status, locale)}: </span>
								<span
									className={cn(
										"min-w-0 flex-1 truncate text-sm leading-5",
										status === "pending" && "text-muted-foreground/65",
										status === "in-progress" && "text-foreground",
										status === "completed" && "text-muted-foreground/60",
									)}
								>
									{item.label[language]}
								</span>
								{status === "in-progress" && !reduced && !exploring ? (
									<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
										{Math.ceil(
											Math.max(
												0,
												(current?.holdMs ?? 0) * (1 - progress / 100),
											) / 1000,
										)}
										s
									</span>
								) : null}
							</button>
						</m.li>
					);
				})}
			</ol>
		</section>
	);
}
