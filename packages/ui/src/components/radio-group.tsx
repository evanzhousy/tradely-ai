import { Radio } from "@heroui/react/radio";
import { RadioGroup as HeroRadioGroup } from "@heroui/react/radio-group";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type RadioGroupProps = Omit<
	ComponentProps<typeof HeroRadioGroup.Root>,
	"isDisabled" | "onChange"
> & {
	disabled?: boolean;
	onValueChange?: (value: string) => void;
};

function RadioGroup({
	className,
	disabled,
	onValueChange,
	...props
}: RadioGroupProps) {
	return (
		<HeroRadioGroup.Root
			data-slot="radio-group"
			className={cn("grid w-full gap-3", className)}
			isDisabled={disabled}
			onChange={onValueChange}
			{...props}
		/>
	);
}

function RadioGroupItem({
	children,
	className,
	disabled,
	...props
}: Omit<ComponentProps<typeof Radio.Root>, "children" | "isDisabled"> & {
	children?: ReactNode;
	disabled?: boolean;
}) {
	return (
		<Radio.Root isDisabled={disabled} {...props}>
			<Radio.Content
				data-slot="radio-group-item"
				className={cn("flex items-center gap-3", className)}
			>
				<Radio.Control>
					<Radio.Indicator>
						<span className="size-2 rounded-full bg-current" />
					</Radio.Indicator>
				</Radio.Control>
				{children}
			</Radio.Content>
		</Radio.Root>
	);
}

export { RadioGroup, RadioGroupItem };
