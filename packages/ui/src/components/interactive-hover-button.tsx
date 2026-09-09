// Adapted from Magic UI's Interactive Hover Button on 21st.dev.
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function HoverContents({ children }: { children: ReactNode }) {
	return (
		<>
			<span className="interactive-hover-button-label">{children}</span>
			<span className="interactive-hover-button-arrow" aria-hidden="true">
				<ArrowRightIcon data-icon="inline-end" />
			</span>
		</>
	);
}

/** Keeps Base UI button/link semantics and an always-visible, single accessible label. */
export function InteractiveHoverButton({
	children,
	className,
	...props
}: ComponentProps<typeof Button>) {
	return (
		<Button className={cn("interactive-hover-button", className)} {...props}>
			<HoverContents>{children}</HoverContents>
		</Button>
	);
}

/** Navigation stays a native anchor, including open-in-new-tab and keyboard semantics. */
export function InteractiveHoverLink({
	children,
	className,
	render,
	variant,
	size,
	...props
}: useRender.ComponentProps<"a"> & VariantProps<typeof buttonVariants>) {
	return useRender({
		defaultTagName: "a",
		render,
		state: { slot: "button" },
		props: mergeProps<"a">(
			{
				className: cn(
					buttonVariants({ variant, size }),
					"interactive-hover-button",
					className,
				),
				children: <HoverContents>{children}</HoverContents>,
			},
			props,
		),
	});
}
