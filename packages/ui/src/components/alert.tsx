import { Alert as HeroAlert } from "@heroui/react/alert";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

type AlertVariant = "default" | "destructive";

function Alert({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof HeroAlert.Root> & {
	variant?: AlertVariant;
}) {
	return (
		<HeroAlert.Root
			data-slot="alert"
			role="alert"
			status={variant === "destructive" ? "danger" : undefined}
			className={cn(
				"group/alert relative grid w-full gap-0.5 rounded-2xl border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 has-data-[slot=alert-action]:pr-18 *:[svg:not([class*='size-'])]:size-4 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current",
				variant === "destructive" &&
					"text-destructive *:data-[slot=alert-description]:text-destructive/90",
				className,
			)}
			{...props}
		/>
	);
}

function AlertTitle({
	className,
	...props
}: React.ComponentProps<typeof HeroAlert.Title>) {
	return (
		<HeroAlert.Title
			data-slot="alert-title"
			className={cn(
				"font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<typeof HeroAlert.Description>) {
	return (
		<HeroAlert.Description
			data-slot="alert-description"
			className={cn(
				"text-balance text-muted-foreground text-sm md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
				className,
			)}
			{...props}
		/>
	);
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-action"
			className={cn("absolute top-2.5 right-3", className)}
			{...props}
		/>
	);
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
