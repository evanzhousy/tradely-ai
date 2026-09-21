// Adapted from Magic UI's Interactive Hover Button on 21st.dev.
import {
	Button,
	type ButtonSize,
	type ButtonVariant,
	buttonVariants,
} from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import {
	type ComponentProps,
	cloneElement,
	type ReactElement,
	type ReactNode,
} from "react";

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
}: Omit<ComponentProps<typeof Button>, "children"> & { children: ReactNode }) {
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
}: Omit<ComponentProps<"a">, "children"> & {
	children: ReactNode;
	render?: ReactElement<{ children?: ReactNode; className?: string }>;
	variant?: ButtonVariant;
	size?: ButtonSize;
}) {
	const mergedClassName = cn(
		buttonVariants({ variant, size }),
		"interactive-hover-button",
		render?.props.className,
		className,
	);
	const contents = <HoverContents>{children}</HoverContents>;
	if (render) {
		return cloneElement(
			render,
			{ ...props, className: mergedClassName },
			contents,
		);
	}
	return (
		<a className={mergedClassName} {...props}>
			{contents}
		</a>
	);
}
