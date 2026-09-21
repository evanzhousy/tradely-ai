"use client";

import { ToggleButton } from "@heroui/react/toggle-button";
import { ToggleButtonGroup } from "@heroui/react/toggle-button-group";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps } from "react";

type Key = string | number;

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

type ToggleGroupProps = Omit<
	ComponentProps<typeof ToggleButtonGroup.Root>,
	"onSelectionChange" | "selectedKeys" | "size"
> & {
	multiple?: boolean;
	onValueChange?: (values: string[]) => void;
	size?: ToggleSize;
	spacing?: number;
	value?: string[];
	variant?: ToggleVariant;
};

function mapSize(size: ToggleSize) {
	if (size === "sm" || size === "lg") return size;
	return "md" as const;
}

function ToggleGroup({
	className,
	variant = "default",
	size = "default",
	spacing = 2,
	orientation = "horizontal",
	value,
	onValueChange,
	multiple,
	...props
}: ToggleGroupProps) {
	return (
		<ToggleButtonGroup.Root
			data-slot="toggle-group"
			data-variant={variant}
			data-size={size}
			data-spacing={spacing}
			orientation={orientation}
			selectionMode={multiple ? "multiple" : "single"}
			selectedKeys={value}
			onSelectionChange={(keys) =>
				onValueChange?.([...keys].map((key) => String(key)))
			}
			size={mapSize(size)}
			className={cn(
				"group/toggle-group flex w-fit items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
				variant === "outline" && "rounded-3xl border border-border",
				className,
			)}
			{...props}
		/>
	);
}

function ToggleGroupItem({
	className,
	value,
	...props
}: Omit<ComponentProps<typeof ToggleButton>, "id"> & { value: Key }) {
	return (
		<ToggleButton
			id={value}
			data-slot="toggle-group-item"
			className={cn(
				"shrink-0 focus:z-10 focus-visible:z-10 group-data-[variant=outline]/toggle-group:border-0 group-data-[variant=outline]/toggle-group:bg-transparent",
				className,
			)}
			{...props}
		/>
	);
}

export { ToggleGroup, ToggleGroupItem };
