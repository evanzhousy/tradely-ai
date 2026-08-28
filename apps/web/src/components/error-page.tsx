import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { capturePostHogException } from "@/analytics/client";
import { analyticsRouteName } from "@/analytics/events";

export default function ErrorPage({ error, reset }: ErrorComponentProps) {
	useEffect(() => {
		capturePostHogException(error, {
			source: "route_boundary",
			route_name: analyticsRouteName(window.location.pathname),
		});
	}, [error]);
	return (
		<main
			className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-start justify-center gap-5 px-4 py-16 sm:px-6"
			aria-labelledby="error-title"
			aria-live="assertive"
		>
			<p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.14em]">
				Error
			</p>
			<h1
				id="error-title"
				className="font-semibold text-4xl text-display sm:text-5xl"
			>
				Something went wrong
			</h1>
			<p className="max-w-[55ch] text-muted-foreground leading-7">
				Tradely could not load this page. Retry the request or return to the
				learning hub.
			</p>
			<div className="flex flex-wrap gap-3">
				<Button onClick={reset}>
					<RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
					Retry
				</Button>
				<Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
					Return home
				</Link>
			</div>
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
