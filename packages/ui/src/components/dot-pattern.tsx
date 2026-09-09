// Adapted from Magic UI's Dot Pattern, listed on 21st.dev. See docs/21st-components.md.
import { cn } from "@tradely/ui/lib/utils";
import { type ComponentProps, useId } from "react";

/** A static SVG tile keeps the paper texture deterministic, including during SSR. */
export function DotPattern({ className, ...props }: ComponentProps<"svg">) {
	const id = useId();
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			className={cn("dot-pattern", className)}
			{...props}
		>
			<defs>
				<pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
					<circle cx="1" cy="1" r="0.8" fill="currentColor" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}
