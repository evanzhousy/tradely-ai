import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { DotPattern } from "@tradely/ui/components/dot-pattern";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
} from "@tradely/ui/components/empty";
import { cn } from "@tradely/ui/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { capturePostHogExceptionWhenReady } from "@/analytics/client";
import { analyticsRouteName } from "@/analytics/events";

export default function ErrorPage({ error, reset }: ErrorComponentProps) {
	useEffect(() => {
		void capturePostHogExceptionWhenReady(error, {
			source: "route_boundary",
			route_name: analyticsRouteName(window.location.pathname),
		});
	}, [error]);
	return (
		<main
			className="state-page"
			aria-labelledby="error-title"
			aria-live="assertive"
		>
			<DotPattern />
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<RefreshCwIcon aria-hidden="true" />
					</EmptyMedia>
					<h1
						id="error-title"
						className="font-semibold text-4xl text-display sm:text-5xl"
					>
						Something went wrong
					</h1>
					<EmptyDescription>
						Tradely could not load this page. Retry the request or return to the
						learning hub.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={reset}>
						<RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
						Retry
					</Button>
					<Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
						Return home
					</Link>
				</EmptyContent>
			</Empty>
			{import.meta.env.DEV ? (
				<details className="w-full rounded-xl border border-border bg-muted/30 p-4 text-sm">
					<summary className="cursor-pointer font-medium">
						Development details
					</summary>
					<pre className="mt-3 overflow-auto whitespace-pre-wrap text-muted-foreground text-xs">
						{error instanceof Error ? error.message : String(error)}
					</pre>
				</details>
			) : null}
		</main>
	);
}
