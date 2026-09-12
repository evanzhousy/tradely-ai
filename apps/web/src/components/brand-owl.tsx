import { cn } from "@tradely/ui/lib/utils";

const owlSizes = {
	48: "size-12",
	80: "size-20",
	96: "size-24",
	160: "size-24 sm:size-40",
} as const;

type OwlPose =
	| "ready"
	| "curious"
	| "reading"
	| "thinking"
	| "complete"
	| "welcome";

/** Decorative companion. Callers own the real instructions, actions and status. */
export function BrandOwl({
	pose = "ready",
	size = 96,
	className,
}: {
	pose?: OwlPose;
	size?: 48 | 80 | 96 | 160;
	className?: string;
}) {
	return (
		<img
			src={`/brand/owl/${pose}.svg`}
			alt=""
			aria-hidden="true"
			width={size}
			height={size}
			decoding="async"
			className={cn("shrink-0 object-contain", owlSizes[size], className)}
		/>
	);
}
