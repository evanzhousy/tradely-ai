import { Button } from "@tradely/ui/components/button";
import { CircularProgress } from "@tradely/ui/components/circular-progress";
import { CheckIcon, ListChecksIcon, RotateCcwIcon } from "lucide-react";
import { useId } from "react";
import { coachingCopy } from "@/features/learning/coaching-copy";
import type { Locale } from "@/i18n/messages";
import {
	platformWidgetCopy as copy,
	type SampleCheckpointId,
	sampleCheckpoints,
} from "./platform-widget-copy";

// Adapted visual motifs: Animata Weekly Progress, Notes, and Reminder Widget.
// See docs/animata-platform-widgets.md. These previews never write account progress.
type CheckpointProps = {
	locale: Locale;
	checked: readonly SampleCheckpointId[];
};

export function LearningCheckpointsWidget({
	locale,
	checked,
}: CheckpointProps) {
	const completed = sampleCheckpoints.filter((step) =>
		checked.includes(step.id),
	).length;
	const percentage = Math.round((completed / sampleCheckpoints.length) * 100);
	return (
		<figure className="platform-checkpoints-widget">
			<figcaption className="platform-widget-caption">
				{copy.sample[locale]}
			</figcaption>
			<div className="platform-checkpoints-heading">
				<p>{copy.progress[locale]}</p>
				<output aria-label={copy.progress[locale]}>
					{percentage}
					<span>%</span>
				</output>
			</div>
			<ul className="platform-checkpoint-rings">
				{sampleCheckpoints.map((step) => (
					<li key={step.id}>
						<CircularProgress
							value={checked.includes(step.id) ? 100 : 0}
							label={copy[step.label][locale]}
						/>
						<span>{copy[step.shortLabel][locale]}</span>
					</li>
				))}
			</ul>
			<p
				className="platform-checkpoints-status"
				aria-live="polite"
				aria-atomic="true"
			>
				{copy.completed[locale]
					.replace("{completed}", String(completed))
					.replace("{total}", String(sampleCheckpoints.length))}
			</p>
			<p className="platform-widget-hint">{copy.progressHint[locale]}</p>
		</figure>
	);
}

export function CoachingNotesWidget({
	locale,
	caption,
	explanation,
	feedback,
	question,
}: {
	locale: Locale;
	caption: string;
	explanation: string;
	feedback: string;
	question: string;
}) {
	return (
		<figure className="platform-notes-widget">
			<figcaption className="platform-widget-caption">{caption}</figcaption>
			<div className="platform-note-original">
				<p className="platform-preview-label">{coachingCopy.before[locale]}</p>
				<blockquote>{explanation}</blockquote>
			</div>
			<div className="platform-feedback-note">
				<p className="platform-note-heading">{copy.note[locale]}</p>
				<dl>
					<div>
						<dt>{coachingCopy.gaps[locale]}</dt>
						<dd>{feedback}</dd>
					</div>
					<div>
						<dt>{coachingCopy.question[locale]}</dt>
						<dd>{question}</dd>
					</div>
				</dl>
			</div>
		</figure>
	);
}

export function EvidenceChecklistWidget({
	locale,
	checked,
	onToggle,
	onReset,
}: CheckpointProps & {
	onToggle: (id: SampleCheckpointId) => void;
	onReset: () => void;
}) {
	const id = useId();
	const remaining = sampleCheckpoints.filter(
		(step) => !checked.includes(step.id),
	).length;
	return (
		<div className="platform-evidence-widget">
			<div className="platform-evidence-heading">
				<p id={id}>
					<ListChecksIcon size={17} aria-hidden="true" />
					{copy.checklist[locale]}
				</p>
				<span>
					{copy.remaining[locale].replace("{count}", String(remaining))}
				</span>
			</div>
			<fieldset aria-labelledby={id}>
				{sampleCheckpoints.map((step) => (
					<label key={step.id} className="platform-checklist-row">
						<input
							type="checkbox"
							checked={checked.includes(step.id)}
							onChange={() => onToggle(step.id)}
						/>
						<span className="platform-checkbox-mark" aria-hidden="true">
							<CheckIcon size={13} />
						</span>
						<span>{copy[step.label][locale]}</span>
					</label>
				))}
			</fieldset>
			<div className="platform-checklist-footer">
				<Button size="sm" variant="ghost" onClick={onReset}>
					<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
					{copy.reset[locale]}
				</Button>
				<p className="platform-widget-hint">{copy.notSaved[locale]}</p>
			</div>
		</div>
	);
}
