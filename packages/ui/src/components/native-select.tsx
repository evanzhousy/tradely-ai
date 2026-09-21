import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import { cn } from "@tradely/ui/lib/utils";
import {
	type ChangeEventHandler,
	Children,
	isValidElement,
	type ReactNode,
} from "react";

type NativeSelectProps = {
	"aria-label"?: string;
	"aria-labelledby"?: string;
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	id?: string;
	name?: string;
	onChange?: ChangeEventHandler<HTMLSelectElement>;
	required?: boolean;
	size?: "sm" | "default";
	value?: string | number;
};

type NativeSelectOptionProps = {
	children: ReactNode;
	disabled?: boolean;
	value: string | number;
};

type NativeSelectOptGroupProps = {
	children: ReactNode;
	label?: string;
};

function NativeSelectOption(_props: NativeSelectOptionProps) {
	return null;
}

function NativeSelectOptGroup(_props: NativeSelectOptGroupProps) {
	return null;
}

function collectOptions(children: ReactNode): NativeSelectOptionProps[] {
	return Children.toArray(children).flatMap((child) => {
		if (!isValidElement(child)) return [];
		if (child.type === NativeSelectOption) {
			return [child.props as NativeSelectOptionProps];
		}
		if (child.type === NativeSelectOptGroup) {
			return collectOptions(
				(child.props as NativeSelectOptGroupProps).children,
			);
		}
		return [];
	});
}

function NativeSelect({
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
	children,
	className,
	disabled,
	id,
	name,
	onChange,
	required,
	size = "default",
	value,
}: NativeSelectProps) {
	const options = collectOptions(children);
	return (
		<Select.Root
			aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Select option")}
			aria-labelledby={ariaLabelledBy}
			className={cn("group/native-select w-fit", className)}
			isDisabled={disabled}
			isRequired={required}
			name={name}
			selectedKey={value === undefined ? undefined : String(value)}
			onSelectionChange={(key) => {
				const nextValue = key === null ? "" : String(key);
				onChange?.({
					target: { value: nextValue },
					currentTarget: { value: nextValue },
				} as unknown as React.ChangeEvent<HTMLSelectElement>);
			}}
		>
			<Select.Trigger
				id={id}
				className={cn(
					"min-w-0 rounded-3xl bg-input/50",
					size === "sm" && "min-h-8",
				)}
			>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					{options.map((option) => (
						<ListBox.Item
							key={String(option.value)}
							id={String(option.value)}
							isDisabled={option.disabled}
							textValue={
								typeof option.children === "string" ||
								typeof option.children === "number"
									? String(option.children)
									: String(option.value)
							}
						>
							{option.children}
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select.Root>
	);
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
