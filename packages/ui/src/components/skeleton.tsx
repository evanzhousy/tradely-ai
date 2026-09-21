import { Skeleton as HeroSkeleton } from "@heroui/react/skeleton";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Skeleton({
	className,
	...props
}: React.ComponentProps<typeof HeroSkeleton>) {
	return (
		<HeroSkeleton
			data-slot="skeleton"
			className={cn("rounded-2xl bg-muted", className)}
			{...props}
		/>
	);
}

export { Skeleton };
