import { ArrowUpRightIcon } from "lucide-react";

import { formatCompact, formatHandle, type TraderProfile } from "./model";
import { TraderAvatar } from "./trader-avatar";

/** The answer a visitor came for, on the first screen: each row opens that trader's profile. */
export function TopTraders({ traders }: { traders: TraderProfile[] }) {
	return (
		<ol className="trader-surface top-traders">
			{traders.map((trader) => (
				<li key={trader.handle}>
					<a
						href={trader.profileUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="top-trader-row"
					>
						<span className="w-6 shrink-0 font-mono text-muted-foreground text-sm tabular-nums">
							{String(trader.rank).padStart(2, "0")}
						</span>
						<TraderAvatar profile={trader} size={40} />
						<span className="min-w-0 flex-1">
							<span className="block truncate font-semibold leading-tight">
								{trader.name}
							</span>
							<span className="mt-0.5 block truncate text-muted-foreground text-xs">
								<span className="font-mono">{formatHandle(trader)}</span>
								{" · "}
								{trader.focus.join(", ")}
							</span>
						</span>
						{trader.followers !== null ? (
							<span className="shrink-0 font-mono text-sm tabular-nums">
								{formatCompact(trader.followers)}
								<span className="sr-only"> followers</span>
							</span>
						) : null}
						<ArrowUpRightIcon
							aria-hidden="true"
							size={16}
							className="hidden shrink-0 text-muted-foreground sm:block"
						/>
						<span className="sr-only">(opens X profile)</span>
					</a>
				</li>
			))}
		</ol>
	);
}
