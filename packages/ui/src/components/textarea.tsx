import { TextArea as HeroTextArea } from "@heroui/react/textarea";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

/** HeroUI's field look, growing with its content from a short minimum. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<HeroTextArea
			data-slot="textarea"
			fullWidth
			className={cn("field-sizing-content min-h-16 resize-none", className)}
			{...props}
		/>
	);
}

export { Textarea };
