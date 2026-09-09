import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import {
	Field,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@tradely/ui/components/field";
import { RadioGroup, RadioGroupItem } from "@tradely/ui/components/radio-group";
import { useId, useState } from "react";

export function UnderstandingCheck({
	question,
	choices,
	answer,
	explanation,
	onInteract,
	onComplete,
}: {
	question: string;
	choices: readonly string[];
	answer: string;
	explanation: string;
	onInteract: () => void;
	onComplete: () => void;
}) {
	const id = useId();
	const [choice, setChoice] = useState("");
	const [feedback, setFeedback] = useState<"correct" | "retry" | null>(null);
	return (
		<div className="flex flex-col gap-5">
			<FieldSet>
				<FieldLegend id={`${id}-question`}>{question}</FieldLegend>
				<RadioGroup
					aria-labelledby={`${id}-question`}
					value={choice}
					onValueChange={(value) => {
						onInteract();
						setChoice(String(value));
						setFeedback(null);
					}}
				>
					{choices.map((label, index) => (
						<Field key={label} orientation="horizontal">
							<RadioGroupItem id={`${id}-${index}`} value={label} />
							<FieldLabel htmlFor={`${id}-${index}`}>{label}</FieldLabel>
						</Field>
					))}
				</RadioGroup>
			</FieldSet>
			<Button
				className="self-start"
				disabled={!choice}
				onClick={() => {
					onInteract();
					const correct = choice === answer;
					setFeedback(correct ? "correct" : "retry");
					if (correct) onComplete();
				}}
			>
				Check understanding
			</Button>
			<div role="status" aria-live="polite">
				{feedback ? (
					<Alert>
						<AlertDescription>
							{feedback === "correct" ? "Correct. " : "Try again. "}
							{explanation}
							{feedback === "correct"
								? " Continue with a free lesson or explore the related course below."
								: ""}
						</AlertDescription>
					</Alert>
				) : null}
			</div>
		</div>
	);
}
