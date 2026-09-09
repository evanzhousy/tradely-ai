// Adapted from Magic UI's Bento Grid on 21st.dev. See docs/21st-components.md.
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export function BentoGrid({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("bento-grid", className)} {...props} />;
}

/** Content and actions stay visible on touch, focus and static/reduced-motion paths. */
export function BentoCard({
	visual,
	eyebrow,
	title,
	description,
	footer,
	children,
	className,
	...props
}: Omit<ComponentProps<typeof Card>, "title"> & {
	visual?: ReactNode;
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<Card className={cn("bento-card", className)} {...props}>
			{visual ? <div className="bento-card-visual">{visual}</div> : null}
			<CardHeader>
				{eyebrow ? <div className="bento-card-eyebrow">{eyebrow}</div> : null}
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			{children ? <CardContent>{children}</CardContent> : null}
			{footer ? <CardFooter>{footer}</CardFooter> : null}
		</Card>
	);
}
