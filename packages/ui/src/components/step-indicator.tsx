import { ProgressBar } from "@heroui/react/progress-bar";
import { CheckIcon } from "lucide-react";

/** A presentation-only stepper; callers own order, advancement, and completion. */
export function StepIndicator({
	steps,
	current,
	complete = false,
	label,
	completeLabel = label,
}: {
	steps: { id: string; label: string }[];
	current: number;
	complete?: boolean;
	label: string;
	completeLabel?: string;
}) {
	if (!steps.length) return null;
	const index = Math.max(0, Math.min(current, steps.length - 1));
	const progress = complete ? 100 : ((index + 1) / steps.length) * 100;
	return (
		<div className="step-progress" data-complete={complete}>
			<p className="step-progress-summary" role="status">
				<span>{complete ? completeLabel : (steps[index]?.label ?? label)}</span>
				<span className="step-progress-count">
					{complete ? steps.length : index + 1} / {steps.length}
				</span>
			</p>
			<ProgressBar.Root value={progress} aria-label={label} size="sm">
				<ProgressBar.Track>
					<ProgressBar.Fill />
				</ProgressBar.Track>
			</ProgressBar.Root>
			<ol className="step-indicator" aria-label={label}>
				{steps.map((step, index) => (
					<li
						key={step.id}
						aria-current={!complete && current === index ? "step" : undefined}
						data-complete={complete || index < current}
					>
						<span className="step-indicator-marker" aria-hidden="true">
							{complete || index < current ? (
								<CheckIcon size={13} />
							) : (
								index + 1
							)}
						</span>
						<span>{step.label}</span>
					</li>
				))}
			</ol>
		</div>
	);
}
