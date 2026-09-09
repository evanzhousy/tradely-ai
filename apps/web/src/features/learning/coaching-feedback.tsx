import { Button } from "@tradely/ui/components/button";
import { useId, useState } from "react";
import type {
	CoachingSnapshot,
	CoachingFeedback as Feedback,
} from "@/domain/coaching/types";
import { coachingCopy } from "./coaching-copy";

export function CoachingFeedback({
	feedback,
	snapshot,
	locale,
}: {
	feedback: Feedback;
	snapshot: CoachingSnapshot;
	locale: "en" | "zh";
}) {
	const [selected, setSelected] = useState<string | null>(null);
	const evidenceId = useId();
	const text = (key: keyof typeof coachingCopy) => coachingCopy[key][locale];
	const source = snapshot.references.find((r) => r.id === selected);
	const item = (
		value: { text: string; referenceIds: string[] },
		index: number,
	) => (
		<li key={index} className="flex flex-col gap-2">
			<p className="whitespace-pre-wrap break-words">{value.text}</p>
			<div className="flex flex-wrap gap-2">
				{value.referenceIds.map((id) => (
					<Button
						key={id}
						variant="outline"
						size="sm"
						aria-controls={evidenceId}
						aria-expanded={selected === id}
						onClick={() => setSelected(selected === id ? null : id)}
					>
						{snapshot.references.find((r) => r.id === id)?.label ?? id}
					</Button>
				))}
			</div>
		</li>
	);
	return (
		<div className="flex flex-col gap-4 text-sm" data-analytics-private>
			{feedback.strengths.length > 0 ? (
				<section className="flex flex-col gap-2">
					<h4 className="font-medium">{text("support")}</h4>
					<ul className="flex flex-col gap-3">
						{feedback.strengths.map(item)}
					</ul>
				</section>
			) : null}
			{feedback.gaps.length > 0 ? (
				<section className="flex flex-col gap-2">
					<h4 className="font-medium">{text("gaps")}</h4>
					<ul className="flex flex-col gap-3">{feedback.gaps.map(item)}</ul>
				</section>
			) : null}
			{feedback.question ? (
				<section className="flex flex-col gap-2">
					<h4 className="font-medium">{text("question")}</h4>
					<p className="whitespace-pre-wrap break-words">{feedback.question}</p>
				</section>
			) : null}
			{feedback.revisionSummary ? (
				<section className="flex flex-col gap-2">
					<h4 className="font-medium">{text("change")}</h4>
					<p className="whitespace-pre-wrap break-words">
						{feedback.revisionSummary}
					</p>
				</section>
			) : null}
			<div id={evidenceId} aria-live="polite">
				{source ? (
					<aside className="flex flex-col gap-2 rounded-lg bg-muted p-3">
						<h4 className="font-medium">
							{text("reference")}: {source.label}
						</h4>
						<p className="whitespace-pre-wrap break-words">{source.text}</p>
					</aside>
				) : null}
			</div>
		</div>
	);
}
