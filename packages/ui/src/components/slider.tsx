import { Slider } from "@heroui/react/slider";
import { cn } from "@tradely/ui/lib/utils";
import type {
	ChangeEventHandler,
	FocusEventHandler,
	KeyboardEventHandler,
	PointerEventHandler,
} from "react";

type RangeSliderProps = {
	"aria-describedby"?: string;
	"aria-label": string;
	"aria-valuetext"?: string;
	className?: string;
	disabled?: boolean;
	id?: string;
	formatValueText?: (value: number) => string;
	max: number | string;
	min: number | string;
	onBlur?: FocusEventHandler<HTMLDivElement>;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
	onPointerCancel?: PointerEventHandler<HTMLDivElement>;
	onPointerDown?: PointerEventHandler<HTMLDivElement>;
	onPointerUp?: PointerEventHandler<HTMLDivElement>;
	onValueChange?: (value: number) => void;
	step: number | string;
	type?: "range";
	value: number | string;
};

function RangeSlider({
	"aria-label": ariaLabel,
	"aria-valuetext": ariaValueText,
	className,
	disabled,
	formatValueText,
	max,
	min,
	onChange,
	onValueChange,
	step,
	value,
	...props
}: RangeSliderProps) {
	return (
		<Slider.Root
			aria-label={ariaLabel}
			className={cn("w-full", className)}
			isDisabled={disabled}
			maxValue={Number(max)}
			minValue={Number(min)}
			step={Number(step)}
			value={Number(value)}
			onChange={(nextValue) => {
				const numericValue = Array.isArray(nextValue)
					? (nextValue[0] ?? Number(min))
					: nextValue;
				const stringValue = String(numericValue);
				onChange?.({
					target: { value: stringValue },
					currentTarget: { value: stringValue },
				} as unknown as React.ChangeEvent<HTMLInputElement>);
				onValueChange?.(numericValue);
			}}
			{...props}
		>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb
					aria-label={ariaLabel}
					aria-valuetext={formatValueText?.(Number(value)) ?? ariaValueText}
				/>
			</Slider.Track>
		</Slider.Root>
	);
}

export type { RangeSliderProps };
export { RangeSlider, Slider };
