import { RangeSlider } from "@tradely/ui/components/slider";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import {
	CASH,
	RANGE,
	CALL as SOLD_CALL,
	PUT as SOLD_PUT,
	settle,
	type Trade,
} from "@/features/learning/lessons/selling-covered-options-model";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

const dollars = (cents: number) =>
	(cents / 100).toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});
const signed = (cents: number) =>
	cents > 0 ? `+${dollars(cents)}` : cents < 0 ? `−${dollars(-cents)}` : "$0";

const trades: { id: Trade; label: string }[] = [
	{ id: "call", label: "Covered call" },
	{ id: "put", label: "Cash-secured put" },
];

/** Figures come from the selling-covered-options lesson's model, so the two cannot drift. */
export default function CoveredCallPutDemo() {
	const [trade, setTrade] = useState<Trade>("call");
	// Opens at an unchanged price, so the check's $110 answer is not on screen before a move.
	const [spot, setSpot] = useState(100);
	const { start, complete } = useDemoAnalytics(
		"covered-call-vs-cash-secured-put",
	);
	const result = settle(trade, spot, false);
	const call = trade === "call";
	const after = call
		? result.assigned
			? `No shares; ${dollars(result.cash)} in cash from selling them at $${SOLD_CALL.strike}`
			: `Still 100 shares, now worth ${dollars(spot * 100 * 100)}`
		: result.assigned
			? `100 shares bought at $${SOLD_PUT.strike} with the ${dollars(CASH)} set aside`
			: `No shares; the ${dollars(CASH)} is free again`;
	return (
		<div className="flex flex-col gap-7">
			<p>
				ALFA was $100 on Sep 16. The covered call owns 100 shares bought at $100
				and sold the Oct 18 {SOLD_CALL.strike} call; the cash-secured put set
				aside {dollars(CASH)} and sold the Oct 18 {SOLD_PUT.strike} put. Each
				kept $205. Choose a trade and ALFA&rsquo;s close on Oct 18.
			</p>
			<ToggleGroup
				aria-label="Trade"
				className="flex-wrap"
				variant="outline"
				value={[trade]}
				onValueChange={(value) => {
					if (value[0]) {
						start();
						setTrade(value[0] as Trade);
					}
				}}
			>
				{trades.map((item) => (
					<ToggleGroupItem key={item.id} value={item.id}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<div className="flex flex-col gap-3">
				<p className="flex justify-between gap-4">
					<span>ALFA at expiry, Oct 18</span>
					<strong className="shrink-0 whitespace-nowrap font-mono">
						${spot}
					</strong>
				</p>
				<RangeSlider
					aria-label="ALFA at expiry"
					min={RANGE[0]}
					max={RANGE[1]}
					step={1}
					value={spot}
					formatValueText={(value) => `$${value}`}
					onValueChange={(value) => {
						start();
						setSpot(value);
					}}
				/>
			</div>
			<div
				role="status"
				aria-live="polite"
				className="flex flex-col gap-3 rounded-xl border p-5"
			>
				<p>
					{result.assigned
						? `Assigned: ALFA ended ${call ? "above" : "below"} the ${call ? SOLD_CALL.strike : SOLD_PUT.strike} strike.`
						: `Not assigned: the ${call ? "call" : "put"} expires worthless and the $205 is kept.`}
				</p>
				<p>
					Result for one contract before fees{" "}
					<strong className="block font-mono text-3xl">
						{signed(result.profit)}
					</strong>
				</p>
				<p className="text-muted-foreground text-sm">Afterwards: {after}.</p>
			</div>
			<p className="text-muted-foreground text-sm">
				A made-up stock and the course&rsquo;s example quotes, held to expiry.
				Fees, dividends and early assignment are left out here; the guide above
				covers early assignment.
			</p>
			<UnderstandingCheck
				question="ALFA closes at $110 on Oct 18. What happens to the covered call?"
				choices={[
					"You keep the shares and make +$1,205",
					"Your shares are sold at $105 and the result is +$705",
					"The call expires worthless and you keep the shares",
				]}
				answer="Your shares are sold at $105 and the result is +$705"
				explanation="$110 is above the 105 strike, so the call is assigned and your shares go at $105: +$500 on the shares plus the $205 premium. The $5 a share above $105 goes to the call's holder."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
