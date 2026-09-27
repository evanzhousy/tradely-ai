import { Field, FieldLabel } from "@tradely/ui/components/field";
import { RangeSlider } from "@tradely/ui/components/slider";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useId } from "react";

/** Lesson explore controls: a set of exclusive choices, and a labeled range. */
export function ChoiceField<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: readonly (readonly [T, string])[];
	onChange: (value: T) => void;
}) {
	const id = useId();
	return (
		<Field>
			<FieldLabel id={id}>{label}</FieldLabel>
			<ToggleGroup
				aria-labelledby={id}
				value={[value]}
				onValueChange={(values) => {
					const option = options.find(([key]) => key === values[0]);
					if (option) onChange(option[0]);
				}}
				variant="outline"
				className="flex-wrap"
			>
				{options.map(([key, label]) => (
					<ToggleGroupItem key={key} value={key}>
						{label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</Field>
	);
}

export function RangeControl({
	label,
	value,
	display,
	min,
	max,
	step = 1,
	onChange,
}: {
	label: string;
	value: number;
	display: string;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<Field>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<output id={`${id}-value`} htmlFor={id} className="font-mono text-sm">
					{display}
				</output>
			</div>

			<RangeSlider
				id={id}
				min={min}
				max={max}
				step={step}
				value={value}
				aria-label={label}
				formatValueText={() => display}
				onValueChange={onChange}
				className="mt-1"
			/>
		</Field>
	);
}
