import { ProgressBar } from "@heroui/react/progress-bar";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

function Progress({
	className,
	...props
}: Omit<React.ComponentProps<typeof ProgressBar.Root>, "children">) {
	return (
		<ProgressBar.Root
			data-slot="progress"
			className={cn("flex flex-wrap gap-3", className)}
			{...props}
		>
			<ProgressTrack>
				<ProgressIndicator />
			</ProgressTrack>
		</ProgressBar.Root>
	);
}

function ProgressTrack({
	className,
	...props
}: React.ComponentProps<typeof ProgressBar.Track>) {
	return (
		<ProgressBar.Track
			data-slot="progress-track"
			className={cn(
				"relative flex h-3 w-full items-center overflow-x-hidden rounded-full bg-muted",
				className,
			)}
			{...props}
		/>
	);
}

function ProgressIndicator({
	className,
	...props
}: React.ComponentProps<typeof ProgressBar.Fill>) {
	return (
		<ProgressBar.Fill
			data-slot="progress-indicator"
			className={cn("h-full bg-primary transition-all", className)}
			{...props}
		/>
	);
}

function ProgressLabel({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn("font-medium text-sm", className)}
			data-slot="progress-label"
			{...props}
		/>
	);
}

function ProgressValue({
	className,
	...props
}: React.ComponentProps<typeof ProgressBar.Output>) {
	return (
		<ProgressBar.Output
			className={cn(
				"ml-auto text-muted-foreground text-sm tabular-nums",
				className,
			)}
			data-slot="progress-value"
			{...props}
		/>
	);
}

export {
	Progress,
	ProgressIndicator,
	ProgressLabel,
	ProgressTrack,
	ProgressValue,
};
