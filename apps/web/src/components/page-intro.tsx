import { DotPattern } from "@tradely/ui/components/dot-pattern";
import { cn } from "@tradely/ui/lib/utils";
import type { ReactNode } from "react";

/** The shared page opening owns hierarchy; routes provide their real content and actions. */
export function PageIntro({
	eyebrow,
	title,
	description,
	children,
	aside,
	id,
	className,
}: {
	eyebrow: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	aside?: ReactNode;
	id?: string;
	className?: string;
}) {
	return (
		<header
			className={cn("page-intro", aside && "page-intro-split", className)}
		>
			<DotPattern />
			<div className="page-intro-copy">
				<p className="page-eyebrow">{eyebrow}</p>
				<h1 id={id}>{title}</h1>
				{description ? <p className="page-description">{description}</p> : null}
				{children}
			</div>
			{aside ? <div className="page-intro-aside">{aside}</div> : null}
		</header>
	);
}
