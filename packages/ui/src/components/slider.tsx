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
	max: number | string;
	min: number | string;
	onBlur?: FocusEventHandler<HTMLDivElement>;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
	onPointerCancel?: PointerEventHandler<HTMLDivElement>;
	onPointerDown?: PointerEventHandler<HTMLDivElement>;
	onPointerUp?: PointerEventHandler<HTMLDivElement>;
	step: number | string;
	type?: "range";
	value: number | string;
};

function RangeSlider({
	"aria-label": ariaLabel,
	"aria-valuetext": ariaValueText,
	className,
	disabled,
	max,
	min,
	onChange,
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
				const stringValue = String(nextValue);
				onChange?.({
					target: { value: stringValue },
					currentTarget: { value: stringValue },
				} as unknown as React.ChangeEvent<HTMLInputElement>);
			}}
			{...props}
		>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb aria-label={ariaLabel} aria-valuetext={ariaValueText} />
			</Slider.Track>
		</Slider.Root>
	);
}

export type { RangeSliderProps };
export { RangeSlider, Slider };
