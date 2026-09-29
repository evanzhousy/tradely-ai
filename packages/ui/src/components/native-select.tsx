import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import { cn } from "@tradely/ui/lib/utils";
import {
	type ChangeEventHandler,
	Children,
	isValidElement,
	type ReactNode,
} from "react";

/** A select needs a name its readers can hear, in the page's language. */
type NativeSelectName =
	| { "aria-label": string; "aria-labelledby"?: string }
	| { "aria-label"?: string; "aria-labelledby": string };

type NativeSelectProps = NativeSelectName & {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	id?: string;
	name?: string;
	onChange?: ChangeEventHandler<HTMLSelectElement>;
	required?: boolean;
	size?: "sm" | "default";
	/** "outline" matches a small outline button, for a select that sits among buttons. */
	variant?: "field" | "outline";
	/** Shown before the value, inside the trigger. */
	icon?: ReactNode;
	value?: string | number;
};

type NativeSelectOptionProps = {
	children: ReactNode;
	disabled?: boolean;
	/** The option's language when it differs from the page's, such as a language name. */
	lang?: string;
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
	variant = "field",
	icon,
	value,
}: NativeSelectProps) {
	const options = collectOptions(children);
	return (
		<Select.Root
			aria-label={ariaLabel}
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
					"min-w-0",
					variant === "outline"
						? "h-9 min-h-0 items-center gap-1.5 rounded-3xl border border-border bg-transparent py-0 ps-3 pe-8 font-medium text-default-foreground shadow-none hover:bg-default/60 md:h-8 [&>svg]:size-4 [&>svg]:shrink-0"
						: // HeroUI's field look, as for inputs and the search field.
							size === "sm" && "min-h-8",
				)}
			>
				{icon}
				<Select.Value />
				<Select.Indicator
					className={variant === "outline" ? "text-current" : undefined}
				/>
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
							{option.lang ? (
								<span lang={option.lang}>{option.children}</span>
							) : (
								option.children
							)}
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select.Root>
	);
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
