import { CheckIcon } from "lucide-react";

/** A presentation-only stepper; callers own order, advancement, and completion. */
export function StepIndicator({
	steps,
	current,
	complete = false,
	label,
}: {
	steps: { id: string; label: string }[];
	current: number;
	complete?: boolean;
	label: string;
}) {
	return (
		<ol className="step-indicator" aria-label={label}>
			{steps.map((step, index) => (
				<li
					key={step.id}
					aria-current={!complete && current === index ? "step" : undefined}
					data-complete={complete || index < current}
				>
					<span className="step-indicator-marker" aria-hidden="true">
						{complete || index < current ? <CheckIcon size={13} /> : index + 1}
					</span>
					<span>{step.label}</span>
				</li>
			))}
		</ol>
	);
}
