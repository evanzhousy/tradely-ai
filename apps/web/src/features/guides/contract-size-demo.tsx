import { RangeSlider } from "@tradely/ui/components/slider";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import {
	ACCOUNT,
	PERCENT_RANGE,
	type Pick,
	picks,
	RULE_PERCENT,
	sizeFacts,
} from "@/features/learning/lessons/size-and-exit-model";
import { UnderstandingCheck } from "./understanding-check";
import { useDemoAnalytics } from "./use-demo-analytics";

const dollars = (cents: number) =>
	(cents / 100).toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});

const labels: Record<Pick, string> = {
	dear: "Oct 18 100 call",
	cheap: "Nov 15 110 call",
	spread: "105/110 call spread",
};

/** Figures come from the size-and-exit lesson's model, so the two cannot drift. */
export default function ContractSizeDemo() {
	// Opens on the call that fits, so the check's answer (the dearer call: 0) is not on screen.
	const [pick, setPick] = useState<Pick>("cheap");
	const [percent, setPercent] = useState<number>(RULE_PERCENT);
	const { start, complete } = useDemoAnalytics("how-many-option-contracts");
	const facts = sizeFacts(percent, pick);
	return (
		<div className="flex flex-col gap-7">
			<p>
				A {dollars(ACCOUNT)} account. Choose a candidate and an example rule:
				the share of the account you would accept losing on this one trade.
			</p>
			<ToggleGroup
				aria-label="Candidate"
				className="flex-wrap"
				variant="outline"
				value={[pick]}
				onValueChange={(value) => {
					if (value[0]) {
						start();
						setPick(value[0] as Pick);
					}
				}}
			>
				{picks.map((id) => (
					<ToggleGroupItem key={id} value={id}>
						{labels[id]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<div className="flex flex-col gap-3">
				<p className="flex justify-between gap-4">
					<span>Example rule: share of the account at risk</span>
					<strong className="shrink-0 whitespace-nowrap font-mono">
						{percent}%
					</strong>
				</p>
				<RangeSlider
					aria-label="Share of the account at risk"
					min={PERCENT_RANGE.min}
					max={PERCENT_RANGE.max}
					step={PERCENT_RANGE.step}
					value={percent}
					formatValueText={(value) => `${value}%`}
					onValueChange={(value) => {
						start();
						setPercent(value);
					}}
				/>
			</div>
			<dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
				{[
					["Loss budget", dollars(facts.budget)],
					["Worst case, one", dollars(facts.worst)],
					["At risk if bought", dollars(facts.atRisk)],
				].map(([label, value]) => (
					<div key={label}>
						<dt className="text-muted-foreground text-sm">{label}</dt>
						<dd className="font-mono text-xl">{value}</dd>
					</div>
				))}
			</dl>
			<p role="status" aria-live="polite" className="rounded-xl border p-5">
				Contracts that fit, rounded down:{" "}
				<strong className="font-mono text-3xl">{facts.contracts}</strong>
				<span className="mt-2 block text-muted-foreground text-sm">
					{dollars(facts.budget)} ÷ {dollars(facts.worst)}
					{facts.contracts === 0
						? ". One contract can lose more than the budget, so none fits."
						: `, with ${dollars(facts.unused)} of the budget unused.`}
				</span>
			</p>
			<p className="text-muted-foreground text-sm">
				The percentages are examples to do arithmetic with, not a
				recommendation. A bought option or debit spread can lose what was paid
				for it; fees are left out.
			</p>
			<UnderstandingCheck
				question="Your example budget is $200. One Oct 18 100 call costs $4.20 a share. How many contracts fit?"
				choices={[
					"0 contracts",
					"1 contract, rounding $200 ÷ $420 up",
					"47 contracts, since $200 ÷ $4.20 is about 47",
				]}
				answer="0 contracts"
				explanation="One contract is 100 shares, so it can lose $4.20 × 100 = $420, more than the $200 budget. $200 ÷ $420 rounds down to 0. Rounding up would put $420 at risk."
				onInteract={start}
				onComplete={complete}
			/>
		</div>
	);
}
