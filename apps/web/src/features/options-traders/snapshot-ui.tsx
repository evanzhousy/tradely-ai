import { buttonVariants } from "@tradely/ui/components/button";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useAnalytics } from "@/analytics/context";
import { formatRecordedTime, type SnapshotFreshness } from "./model";

/**
 * A page renders its saved snapshot at once, then asks its feed once per load, so a slow or failing
 * read never delays or empties it. Filters are untouched by the swap.
 */
export function useLatestSnapshot<
	Snapshot extends { freshness: SnapshotFreshness },
>(saved: Snapshot, feedPath: string): Snapshot {
	const [snapshot, setSnapshot] = useState(saved);
	useEffect(() => {
		const controller = new AbortController();
		async function checkForNewerPosts() {
			try {
				const response = await fetch(feedPath, { signal: controller.signal });
				// No feed is configured here, so the saved snapshot is final and nothing is late.
				if (response.status === 204) return;
				if (!response.ok) throw new Error("Feed unavailable");
				setSnapshot((await response.json()) as Snapshot);
			} catch {
				if (controller.signal.aborted) return;
				setSnapshot((current) => ({
					...current,
					freshness: {
						...current.freshness,
						status: "failed",
						lastAttemptedAt: new Date().toISOString(),
					},
				}));
			}
		}
		void checkForNewerPosts();
		return () => controller.abort();
	}, [feedPath]);
	return snapshot;
}

type FreshnessDate = { label: string; dateTime: string | null; text: string };

export const recordedDate = (
	label: string,
	dateTime: string | null,
): FreshnessDate => ({
	label,
	dateTime,
	text: formatRecordedTime(dateTime),
});

export const isDelayed = ({ status }: SnapshotFreshness) =>
	status === "failed" || status === "partial";

export function FreshnessPanel({
	freshness,
	dates,
	children,
}: {
	freshness: SnapshotFreshness;
	dates: readonly FreshnessDate[];
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<dl
				aria-label="Saved-post data freshness"
				className="flex flex-wrap gap-x-10 gap-y-4"
			>
				{dates.map(({ label, dateTime, text }) => (
					<div key={label} className="min-w-0">
						<dt className="font-mono text-muted-foreground text-xs">{label}</dt>
						<dd className="mt-1 font-medium text-sm">
							{dateTime ? <time dateTime={dateTime}>{text}</time> : text}
						</dd>
					</div>
				))}
			</dl>
			{isDelayed(freshness) ? (
				<p role="status" className="text-sm">
					<strong>Refresh delayed.</strong> Showing the last saved data.
					{freshness.lastAttemptedAt ? (
						<>
							{" "}
							Last attempt:{" "}
							<time dateTime={freshness.lastAttemptedAt}>
								{formatRecordedTime(freshness.lastAttemptedAt)}
							</time>
							.
						</>
					) : null}
				</p>
			) : null}
			<p className="text-muted-foreground text-xs leading-relaxed">
				{children}
			</p>
		</div>
	);
}

export function OpenOptionTrades({
	surface,
	variant,
}: {
	surface: "options_traders" | "options_traders_reddit";
	variant: "default" | "outline";
}) {
	const { capture } = useAnalytics();
	return (
		<HeroLink
			href={`https://app.tradingflow.com/app/option-trades/live?utm_source=tradely&utm_medium=${surface}`}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() =>
				capture("tradingflow_link_opened", { surface, tool: "Option Trades" })
			}
			className={buttonVariants({ variant })}
		>
			Open Option Trades
			<ExternalLinkIcon aria-hidden="true" size={14} className="ms-1.5" />
		</HeroLink>
	);
}
