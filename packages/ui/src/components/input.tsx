import { Input as HeroInput } from "@heroui/react/input";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

/** HeroUI's field look, the same as its search field and select, full width by default. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<HeroInput
			type={type}
			data-slot="input"
			fullWidth
			className={cn("min-w-0", className)}
			{...props}
		/>
	);
}

export { Input };
