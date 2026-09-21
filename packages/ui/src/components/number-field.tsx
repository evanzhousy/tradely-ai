import { NumberField as HeroNumberField } from "@heroui/react/number-field";
import { MinusIcon, PlusIcon } from "lucide-react";

/** Bounded numeric entry for teaching controls; callers own the value and units. */
export function NumberField({
	id,
	label,
	descriptionId,
	value,
	min,
	max,
	step,
	onChange,
}: {
	id: string;
	label: string;
	descriptionId: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}) {
	return (
		<HeroNumberField.Root
			aria-label={label}
			id={id}
			value={value}
			minValue={min}
			maxValue={max}
			step={step}
			formatOptions={{
				maximumFractionDigits: Number.isInteger(step)
					? 0
					: (step.toString().split(".")[1]?.length ??
						Math.ceil(-Math.log10(step))),
			}}
			onChange={(next) => {
				if (Number.isFinite(next)) onChange(next);
			}}
		>
			<HeroNumberField.Group className="number-field-group">
				<HeroNumberField.DecrementButton
					aria-label={`${label} −`}
					className="number-field-button"
				>
					<MinusIcon aria-hidden="true" size={16} />
				</HeroNumberField.DecrementButton>
				<HeroNumberField.Input
					aria-label={label}
					aria-describedby={descriptionId}
					className="number-field-input"
				/>
				<HeroNumberField.IncrementButton
					aria-label={`${label} +`}
					className="number-field-button"
				>
					<PlusIcon aria-hidden="true" size={16} />
				</HeroNumberField.IncrementButton>
			</HeroNumberField.Group>
		</HeroNumberField.Root>
	);
}
