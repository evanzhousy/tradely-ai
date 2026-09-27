import { Button } from "@tradely/ui/components/button";
import * as m from "motion/react-m";
import { useState } from "react";
import type { Locale } from "@/i18n/messages";
import {
	ChangeHighlight,
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

export type CalculationTerm = { id: string; label: string; value: string };

/** Reveals exact, already calculated terms. Timing never calculates or changes a numeric result. */
export function CalculationTrace({
	terms,
	locale,
}: {
	terms: CalculationTerm[];
	locale: Locale;
}) {
	const [run, setRun] = useState(0);
	const enabled = useLessonMotion();
	return (
		<div className="flex flex-col gap-2">
			<ol
				className="grid grid-cols-2 gap-2 sm:grid-cols-4"
				aria-label={locale === "zh" ? "计算步骤" : "Calculation steps"}
			>
				{terms.map((term, index) => (
					<m.li
						key={term.id + run}
						className="min-w-0 rounded-xl bg-muted/50 p-3"
						initial={run > 0 && enabled ? { opacity: 0, y: 4 } : false}
						animate={{ opacity: 1, y: 0 }}
						transition={
							enabled
								? { ...lessonTransition, delay: run > 0 ? index * 0.065 : 0 }
								: instantTransition
						}
					>
						<p className="text-muted-foreground text-xs">
							{index + 1}. {term.label}
						</p>
						<p className="mt-1 break-words font-mono text-sm">
							<ChangeHighlight value={term.value}>{term.value}</ChangeHighlight>
						</p>
					</m.li>
				))}
			</ol>
			<Button
				variant="ghost"
				size="sm"
				className="self-start"
				onClick={() => setRun((value) => value + 1)}
			>
				{locale === "zh" ? "逐步查看计算" : "Trace the calculation"}
			</Button>
		</div>
	);
}
