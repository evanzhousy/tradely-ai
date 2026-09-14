import { NumberField as Primitive } from "@base-ui/react/number-field";
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
		<Primitive.Root
			id={id}
			value={value}
			min={min}
			max={max}
			step={step}
			format={{
				maximumFractionDigits: Number.isInteger(step)
					? 0
					: (step.toString().split(".")[1]?.length ??
						Math.ceil(-Math.log10(step))),
			}}
			onValueChange={(next) => {
				if (next !== null && Number.isFinite(next)) onChange(next);
			}}
		>
			<Primitive.Group className="number-field-group">
				<Primitive.Decrement
					aria-label={`${label} −`}
					className="number-field-button"
				>
					<MinusIcon aria-hidden="true" size={16} />
				</Primitive.Decrement>
				<Primitive.Input
					aria-label={label}
					aria-describedby={descriptionId}
					className="number-field-input"
				/>
				<Primitive.Increment
					aria-label={`${label} +`}
					className="number-field-button"
				>
					<PlusIcon aria-hidden="true" size={16} />
				</Primitive.Increment>
			</Primitive.Group>
		</Primitive.Root>
	);
}
