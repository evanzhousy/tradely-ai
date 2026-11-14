import { RangeSlider } from "@tradely/ui/components/slider";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import {
	breakEven,
	paid,
	resultAtExpiry,
	returnOn,
	SPOT_RANGE,
	type StrikeId,
	strikeCall,
	strikeCalls,
} from "@/features/learning/lessons/strike-and-expiry-model";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

const usd = (value: number, digits = 0) =>
	value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
const signed = (value: number) =>
	value > 0 ? `+${usd(value)}` : value < 0 ? `−${usd(-value)}` : "$0";
const percent = (fraction: number) => {
	const value = Math.round(fraction * 100);
	return value > 0 ? `+${value}%` : value < 0 ? `−${-value}%` : "0%";
};

/** Figures come from the strike-and-expiry lesson's model, so the two cannot drift. */
export default function StrikeExpiryDemo() {
	const [strike, setStrike] = useState<StrikeId>("atm");
	const [spot, setSpot] = useState(106);
	const { start, complete } = useDemoAnalytics("choose-strike-and-expiration");
	const { contract, moneyness } = strikeCall(strike);
	const result = resultAtExpiry(contract, spot);
	return (
		<div className="flex flex-col gap-7">
			<p>
				ALFA was $100 on Sep 16. Choose one of three Oct 18 calls, bought at the
				ask, and where ALFA ends on Oct 18.
			</p>
			<ToggleGroup
				aria-label="Strike"
				className="flex-wrap"
				variant="outline"
				value={[strike]}
				onValueChange={(value) => {
					if (value[0]) {
						start();
						setStrike(value[0] as StrikeId);
					}
				}}
			>
				{strikeCalls.map((row) => (
					<ToggleGroupItem key={row.id} value={row.id}>
						{row.contract.strike} call
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
					min={SPOT_RANGE[0]}
					max={SPOT_RANGE[1]}
					step={1}
					value={spot}
					formatValueText={(value) => `$${value}`}
					onValueChange={(value) => {
						start();
						setSpot(value);
					}}
				/>
			</div>
			<dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
				{[
					[`Strike, ${moneyness[0]}`, String(contract.strike)],
					["Cost, one contract", usd(paid(contract))],
					["Break-even at expiry", usd(breakEven(contract), 2)],
				].map(([label, value]) => (
					<div key={label}>
						<dt className="text-muted-foreground text-sm">{label}</dt>
						<dd className="font-mono text-xl">{value}</dd>
					</div>
				))}
			</dl>
			<p role="status" aria-live="polite" className="rounded-xl border p-5">
				Result at expiry before fees:{" "}
				<strong className="font-mono text-2xl">{signed(result)}</strong>{" "}
				<span className="font-mono">
					({percent(returnOn(contract, result))} of the cost)
				</span>
			</p>
			<p className="text-muted-foreground text-sm">
				A made-up stock and the course&rsquo;s example quotes. At expiry a call
				is worth only what it is in the money by; selling earlier would also
				depend on time left and implied volatility.
			</p>
			<UnderstandingCheck
				question="ALFA ends at $106 on Oct 18, higher as expected. Which call lost money?"
				choices={["The 95 call", "The 100 call", "The 105 call"]}
				answer="The 105 call"
				explanation="The 105 call cost $2.15 a share, so it breaks even at $107.15. At $106 it is worth $1 a share: $100 − $215 = −$115. The view was right; that strike needed a bigger move."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
