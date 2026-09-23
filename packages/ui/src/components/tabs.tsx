"use client";

import { Tabs as HeroTabs } from "@heroui/react/tabs";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps } from "react";

type Key = string | number;

type TabsProps = Omit<
	ComponentProps<typeof HeroTabs.Root>,
	"onSelectionChange" | "selectedKey"
> & {
	value?: Key;
	onValueChange?: (value: Key) => void;
};

function Tabs({
	className,
	orientation = "horizontal",
	value,
	onValueChange,
	...props
}: TabsProps) {
	return (
		<HeroTabs.Root
			orientation={orientation}
			selectedKey={value}
			onSelectionChange={onValueChange}
			className={cn(
				"group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
				className,
			)}
			{...props}
		/>
	);
}

function TabsList({
	className,
	...props
}: ComponentProps<typeof HeroTabs.List>) {
	return (
		<HeroTabs.List
			className={cn(
				"group/tabs-list inline-flex w-fit items-center justify-center rounded-full p-1 text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	value,
	...props
}: Omit<ComponentProps<typeof HeroTabs.Tab>, "id"> & { value: Key }) {
	return (
		<HeroTabs.Tab
			id={value}
			className={cn(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent px-3 py-1 font-medium text-muted-foreground text-sm transition-colors data-[selected=true]:text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	value,
	...props
}: Omit<ComponentProps<typeof HeroTabs.Panel>, "id"> & { value: Key }) {
	return (
		<HeroTabs.Panel
			id={value}
			className={cn("flex-1 text-sm outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
