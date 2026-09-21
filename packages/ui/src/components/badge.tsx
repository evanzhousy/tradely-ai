import { Chip } from "@heroui/react/chip";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps } from "react";

type BadgeVariant =
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "ghost"
	| "link";

type BadgeProps = Omit<ComponentProps<typeof Chip>, "color" | "variant"> & {
	variant?: BadgeVariant;
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
	const color = variant === "destructive" ? "danger" : "default";
	const heroVariant =
		variant === "default"
			? "primary"
			: variant === "secondary" || variant === "outline"
				? "secondary"
				: variant === "destructive"
					? "soft"
					: "tertiary";

	return (
		<Chip
			color={color}
			variant={heroVariant}
			size="sm"
			className={cn(
				variant === "link" && "text-primary underline-offset-4 hover:underline",
				className,
			)}
			{...props}
		/>
	);
}

export { Badge };
