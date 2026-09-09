import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import { ivQuotes, quotePnl } from "./examples";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

export default function IvCrushDemo() {
	const [selected, setSelected] = useState("before");
	const { start, complete } = useDemoAnalytics("iv-crush");
	const quote = ivQuotes.find((item) => item.id === selected) ?? ivQuotes[0];
	return (
		<div className="flex flex-col gap-7">
			<p>
				One long $105 call, bought at $3 per share; multiplier 100. Choose a
				supplied hypothetical quote.
			</p>
			<ToggleGroup
				aria-label="Hypothetical event outcome"
				className="flex-wrap"
				variant="outline"
				value={[selected]}
				onValueChange={(value) => {
					if (value[0]) {
						start();
						setSelected(String(value[0]));
					}
				}}
			>
				{ivQuotes.map((item) => (
					<ToggleGroupItem key={item.id} value={item.id}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
				{[
					["Stock", `$${quote.spot}`],
					["Supplied IV", `${quote.iv}%`],
					["Days remaining", quote.days],
					["Option / share", `$${quote.premium}`],
				].map(([label, value]) => (
					<div key={label}>
						<dt className="text-muted-foreground text-sm">{label}</dt>
						<dd className="font-mono text-2xl">{value}</dd>
					</div>
				))}
			</dl>
			<p role="status" aria-live="polite" className="rounded-xl border p-5">
				Marked change before fees:{" "}
				<strong className="font-mono text-2xl">
					{quotePnl(quote.premium).toLocaleString("en-US", {
						style: "currency",
						currency: "USD",
						maximumFractionDigits: 0,
					})}
				</strong>
				<span className="mt-2 block text-muted-foreground text-sm">
					(${quote.premium} − $3) × 100. A quote is not an executed fill.
				</span>
			</p>
			<p className="text-muted-foreground text-sm">
				Prices and IV are authored scenario inputs, not outputs from a pricing
				engine. Several inputs change together; this comparison does not isolate
				IV’s causal contribution or predict an earnings outcome.
			</p>
			<UnderstandingCheck
				question="The stock rises to $103, but the supplied call quote is $1. What follows?"
				choices={[
					"The long call must be profitable because the stock rose",
					"The marked change is −$200; direction alone did not determine the result",
				]}
				answer="The marked change is −$200; direction alone did not determine the result"
				explanation="The change is ($1 − $3) × 100 = −$200 before fees. Separating IV’s effect requires controlled repricing."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
