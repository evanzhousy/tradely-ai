import { Button } from "@tradely/ui/components/button";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { seededOrder } from "./answers";
import type { ExploreTask } from "./types";

const copy = {
	task: ["Your task", "你的任务"],
	notYet: ["Not yet. Keep adjusting the example.", "还没有。继续调整示例。"],
	found: ["Found it", "找到了"],
	right: ["That's it", "答对了"],
	miss: ["Not this one. Look at the diagram again.", "不是这个。再看看图。"],
	answer: ["The answer", "答案"],
} as const satisfies Record<string, Copy>;

/**
 * The explore phase's goal. A "reach" task watches the example and confirms the moment the
 * learner gets there; an "answer" task asks about what the explored diagram shows, allows a
 * second try, then explains.
 */
export function TaskPanel({
	task,
	explore,
	locale,
	seed,
	solved,
	onSolved,
}: {
	task: ExploreTask<unknown>;
	explore: unknown;
	locale: Locale;
	seed: string;
	solved: boolean;
	onSolved: (attempts: number) => void;
}) {
	const t = (value: Copy) => pick(value, locale);
	const [misses, setMisses] = useState<readonly string[]>([]);
	const reached =
		task.kind === "reach" && explore !== null && task.reached(explore);
	useEffect(() => {
		if (reached && !solved) onSolved(1);
	}, [reached, solved, onSolved]);

	if (task.kind === "reach")
		return (
			<section
				className="wt-panel wt-task"
				data-kind={solved ? "right" : "task"}
				aria-live="polite"
			>
				<p className="wt-panel-title flex items-center gap-1.5">
					{solved ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
					{solved ? t(copy.found) : t(copy.task)}
				</p>
				<p>{t(task.prompt)}</p>
				<p className={solved ? undefined : "wt-panel-note"}>
					{solved ? t(task.done) : t(copy.notYet)}
				</p>
			</section>
		);

	const revealed = solved || misses.length >= 2;
	const answer = task.choices.find((choice) => choice.id === task.answer);
	return (
		<section
			className="wt-panel wt-task"
			data-kind={solved ? "right" : revealed ? "wrong" : "task"}
		>
			<p className="wt-panel-title flex items-center gap-1.5">
				{solved ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
				{solved ? t(copy.right) : t(copy.task)}
			</p>
			<p>{t(task.prompt)}</p>
			<div className="wt-choices">
				{seededOrder(task.choices, `${seed}:task`).map((choice) => (
					<Button
						key={choice.id}
						variant="outline"
						className="wt-choice"
						data-state={
							revealed && choice.id === task.answer
								? "hit"
								: misses.includes(choice.id)
									? "miss"
									: undefined
						}
						aria-pressed={misses.includes(choice.id) || undefined}
						disabled={revealed || misses.includes(choice.id)}
						onClick={() => {
							if (choice.id === task.answer) onSolved(misses.length + 1);
							else setMisses((all) => [...all, choice.id]);
						}}
					>
						{t(choice.label)}
					</Button>
				))}
			</div>
			<div aria-live="polite" className="flex flex-col gap-1">
				{misses.length > 0 && !revealed ? (
					<p className="wt-panel-note">{t(copy.miss)}</p>
				) : null}
				{revealed ? (
					<>
						{!solved && answer ? (
							<p className="wt-panel-note">
								{t(copy.answer)}: {t(answer.label)}
							</p>
						) : null}
						<p>{t(task.done)}</p>
					</>
				) : null}
			</div>
		</section>
	);
}
