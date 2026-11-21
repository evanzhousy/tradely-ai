"use client";

import { buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import {
	SegmentedControl,
	SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectItemIndicator,
	SelectTrigger,
	SelectValue,
} from "@ui-sdk/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// The trader pages draw ui-sdk's unstyled parts with the site's HeroUI tokens, so they match the
// rest of Tradely in both themes.
const fieldLabel = "font-medium text-foreground text-sm";
const fieldSurface =
	"rounded-field border-(length:--border-width-field) border-(--field-border) bg-field text-field-foreground text-sm shadow-field outline-none transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none hover:border-(--field-border-hover) hover:bg-field-hover focus-visible:border-(--field-border-focus) focus-visible:bg-(--field-focus) focus-visible:status-focused";

type Option = {
	value: string;
	label: string;
	/** The option's language when it differs from the page's, such as a language name. */
	lang?: string;
	icon?: ReactNode;
};

function FilterSelect({
	label,
	value,
	options,
	onChange,
	className,
}: {
	label: string;
	value: string;
	options: readonly Option[];
	onChange: (value: string) => void;
	className?: string;
}) {
	const selected = options.find((option) => option.value === value);
	return (
		<Field className={cn("flex min-w-0 flex-col gap-2", className)}>
			<FieldLabel className={fieldLabel}>{label}</FieldLabel>
			<Select
				items={options.map(({ value, label }) => ({ value, label }))}
				value={value}
				onValueChange={(next) => {
					// A single select only reports null when cleared, which these never are.
					if (typeof next === "string") onChange(next);
				}}
			>
				<SelectTrigger
					className={cn(
						fieldSurface,
						"relative flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 ps-3 pe-8 text-start",
					)}
				>
					{selected?.icon}
					<SelectValue className="truncate" />
					<ChevronDownIcon
						aria-hidden="true"
						size={16}
						className="absolute inset-y-0 end-2 my-auto in-data-open:rotate-180 text-field-placeholder transition-transform duration-150"
					/>
				</SelectTrigger>
				<SelectContent
					sideOffset={6}
					className="max-h-[min(22rem,var(--available-height))] min-w-(--anchor-width) overflow-y-auto overscroll-contain rounded-[min(32px,var(--radius-3xl))] bg-overlay p-1 text-overlay-foreground text-sm shadow-(--overlay-shadow) outline-none transition-[opacity,transform] duration-150 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
				>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							label={option.label}
							className="relative flex min-h-9 cursor-pointer items-center gap-2 rounded-2xl px-2 py-1.5 pe-8 outline-none data-highlighted:bg-default"
						>
							{option.icon}
							<span lang={option.lang}>{option.label}</span>
							<SelectItemIndicator className="absolute end-2 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-default-foreground">
								<CheckIcon aria-hidden="true" size={14} />
							</SelectItemIndicator>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

// The checked item carries its own fill rather than a measured indicator, so the server-rendered
// page already shows which view is on.
function ViewSwitch<Value extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: Value;
	options: readonly { value: Value; label: string }[];
	onChange: (value: Value) => void;
}) {
	return (
		<SegmentedControl
			aria-label={label}
			value={value}
			onValueChange={(next) => {
				if (next !== null) onChange(next as Value);
			}}
			className="inline-flex w-fit items-center rounded-3xl border border-border"
		>
			{options.map((option) => (
				<SegmentedControlItem
					key={option.value}
					value={option.value}
					className="focus-visible:status-focused inline-flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-3xl px-4 font-medium text-muted-foreground text-sm outline-none transition-colors duration-100 hover:bg-default data-checked:bg-primary data-checked:text-primary-foreground motion-reduce:transition-none md:h-9"
				>
					{option.label}
				</SegmentedControlItem>
			))}
		</SegmentedControl>
	);
}

function SearchField({
	label,
	value,
	placeholder,
	onChange,
	className,
}: {
	label: string;
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
	className?: string;
}) {
	return (
		<Field className={cn("flex min-w-0 flex-col gap-2", className)}>
			<FieldLabel className={fieldLabel}>{label}</FieldLabel>
			<Input
				type="search"
				value={value}
				placeholder={placeholder}
				onValueChange={(next) => onChange(next)}
				// Search text stays out of session replays as well as events.
				className={cn(
					fieldSurface,
					"ph-no-capture h-9 w-full min-w-0 px-3 placeholder:text-muted-foreground",
				)}
			/>
		</Field>
	);
}

function ActionButton({
	variant = "outline",
	size = "default",
	className,
	...props
}: Omit<ComponentProps<typeof Button>, "className"> & {
	className?: string;
	variant?: "default" | "outline";
	size?: "default" | "sm";
}) {
	return (
		<Button
			{...props}
			className={cn(buttonVariants({ variant, size }), className)}
		/>
	);
}

export type { Option as FilterOption };
export {
	ActionButton,
	FilterSelect,
	fieldLabel,
	fieldSurface,
	SearchField,
	ViewSwitch,
};
