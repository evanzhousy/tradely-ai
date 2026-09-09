import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import { gexContributions, summarizeGex } from "./examples";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

export default function GexDemo() {
	const [coverage, setCoverage] = useState("complete");
	const { start, complete } = useDemoAnalytics("gamma-exposure");
	const values = gexContributions.map((value, index) =>
		coverage === "missing" && index === 2 ? null : value,
	);
	const totals = summarizeGex(values);
	return (
		<div className="flex flex-col gap-7">
			<ToggleGroup
				aria-label="Snapshot coverage"
				className="flex-wrap"
				variant="outline"
				value={[coverage]}
				onValueChange={(value) => {
					if (value[0]) {
						start();
						setCoverage(String(value[0]));
					}
				}}
			>
				<ToggleGroupItem value="complete">Complete snapshot</ToggleGroupItem>
				<ToggleGroupItem value="missing">Missing last row</ToggleGroupItem>
			</ToggleGroup>
			<div className="grid gap-4 sm:grid-cols-3">
				{values.map((value, index) => (
					<div
						key={`strike-${100 + index * 5}`}
						className="rounded-xl border p-4"
					>
						<p className="text-muted-foreground text-sm">
							Strike {100 + index * 5} · 30 days
						</p>
						<p className="mt-2 font-mono text-2xl">
							{value === null
								? "Missing"
								: `${value > 0 ? "+" : ""}${value.toLocaleString("en-US")}`}
						</p>
					</div>
				))}
			</div>
			<dl className="grid gap-4 sm:grid-cols-3">
				{[
					["Complete net", totals.net],
					["Complete gross", totals.gross],
					["Known net subtotal", totals.knownSubtotal],
				].map(([label, value]) => (
					<div key={label}>
						<dt className="text-muted-foreground text-sm">{label}</dt>
						<dd className="font-mono text-xl">
							{value === null
								? "Unknown"
								: Number(value).toLocaleString("en-US")}
						</dd>
					</div>
				))}
			</dl>
			<p className="text-muted-foreground text-sm">
				All contributions use USD of delta exposure per 1% underlying move, with
				supplied hypothetical signs. These are neither observed dealer positions
				nor predicted profits.
			</p>
			<UnderstandingCheck
				question="If the final +500 row becomes missing, what is the complete net GEX?"
				choices={["+500", "+1,000", "Unknown; +500 is only the known subtotal"]}
				answer="Unknown; +500 is only the known subtotal"
				explanation="Missing coverage prevents a complete total. The two visible rows sum to +500."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
