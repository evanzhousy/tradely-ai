import { Kbd as HeroKbd } from "@heroui/react/kbd";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Kbd({ className, ...props }: React.ComponentProps<typeof HeroKbd>) {
	return (
		<HeroKbd
			data-slot="kbd"
			className={cn(
				"pointer-events-none inline-flex h-5.5 w-fit min-w-5.5 select-none items-center justify-center gap-1 rounded-lg bg-muted px-1.5 font-medium font-sans text-muted-foreground text-xs",
				className,
			)}
			{...props}
		/>
	);
}

function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="kbd-group"
			className={cn("inline-flex items-center gap-1", className)}
			{...props}
		/>
	);
}

export { Kbd, KbdGroup };
