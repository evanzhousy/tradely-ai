import { Button } from "@tradely/ui/components/button";
import { useState } from "react";
import { reportedOiChange } from "@/domain/learning/flow-structure";
import { oiLedger, oiTrades } from "./examples";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

export default function OiVolumeDemo() {
	const [steps, setSteps] = useState(0);
	const { start, complete } = useDemoAnalytics("open-interest-vs-volume");
	const ledger = oiLedger(steps);
	const change = reportedOiChange({
		previousOi: {
			value: 100,
			scope: "ALFA call 105 October",
			asOf: "2026-09-02",
		},
		reportedOi: {
			value: ledger.oi,
			scope: "ALFA call 105 October",
			asOf: "2026-09-03",
		},
	});
	return (
		<div className="flex flex-col gap-7">
			<p>
				Start with 100 outstanding contracts in one hypothetical series. Advance
				through trades whose opening and closing designations are supplied.
			</p>
			<ol className="flex flex-col gap-3">
				{oiTrades.map((row, index) => (
					<li
						key={row.label}
						className="flex flex-wrap justify-between gap-2 rounded-xl border p-4"
					>
						<span>
							{index + 1}. {row.label} · {row.contracts} contracts
						</span>
						<span className="font-mono text-sm">
							{index < steps
								? `Recorded · OI ${row.change > 0 ? "+" : ""}${row.change}`
								: "Not yet recorded"}
						</span>
					</li>
				))}
			</ol>
			<Button
				className="self-start"
				disabled={steps === oiTrades.length}
				onClick={() => {
					start();
					setSteps((value) => value + 1);
				}}
			>
				Record next trade
			</Button>
			<div
				role="status"
				aria-live="polite"
				className="grid gap-4 sm:grid-cols-3"
			>
				<p>
					Session volume{" "}
					<strong className="block font-mono text-3xl">{ledger.volume}</strong>
				</p>
				<p>
					Modeled outstanding{" "}
					<strong className="block font-mono text-3xl">{ledger.oi}</strong>
				</p>
				<p>
					Modeled OI change{" "}
					<strong className="block font-mono text-3xl">
						{change !== null && change > 0 ? "+" : ""}
						{change ?? "Unknown"}
					</strong>
				</p>
			</div>
			<p className="text-muted-foreground text-sm">
				The outstanding ledger is a teaching model, not a live OI feed. Actual
				OI must be checked against the next comparable cleared report; other
				lifecycle changes are omitted here.
			</p>
			<UnderstandingCheck
				question="After all three trades, what does volume 190 tell you about new outstanding positions?"
				choices={[
					"190 new contracts were created",
					"The supplied ledger adds 40; volume alone cannot establish this",
				]}
				answer="The supplied ledger adds 40; volume alone cannot establish this"
				explanation="OI changes by +80 −40 +0 = +40. Both opening and closing transactions contribute to volume."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
