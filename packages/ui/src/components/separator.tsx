"use client";

import { Separator as HeroSeparator } from "@heroui/react/separator";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Separator({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof HeroSeparator>) {
	return (
		<HeroSeparator
			data-slot="separator"
			orientation={orientation}
			className={cn(
				"shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
				className,
			)}
			{...props}
		/>
	);
}

export { Separator };
