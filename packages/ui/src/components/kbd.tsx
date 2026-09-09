// shadcn/ui (Base UI / Luma), also listed on 21st.dev. See docs/21st-components.md.

import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"pointer-events-none inline-flex h-5.5 w-fit min-w-5.5 select-none items-center justify-center gap-1 rounded-lg bg-muted in-data-[slot=input-group]:bg-input in-data-[slot=tooltip-content]:bg-background/20 px-1.5 font-medium font-sans in-data-[slot=tooltip-content]:text-background text-muted-foreground text-xs [&_svg:not([class*='size-'])]:size-3",
				className,
			)}
			{...props}
		/>
	);
}

function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd-group"
			className={cn("inline-flex items-center gap-1", className)}
			{...props}
		/>
	);
}

export { Kbd, KbdGroup };
