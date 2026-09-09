// shadcn/ui (Base UI / Luma), also listed on 21st.dev. See docs/21st-components.md.

import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-2xl bg-muted", className)}
			{...props}
		/>
	);
}

export { Skeleton };
