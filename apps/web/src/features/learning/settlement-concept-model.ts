/** Public teaching fixtures and relationships; never assessment cases or execution instructions. */
export type SettlementOptionType = "CALL" | "PUT";
export type ExerciseStyle = "american" | "european";
export type ExitRoute = "close" | "exercise";

export const physicalTerms = {
	strike: 50,
	sharesPerContract: 100,
	completedSalePerShare: 2.5,
} as const;
export const cashTerms = {
	strike: 4000,
	dollarsPerPoint: 100,
	lastDisplay: 4030,
} as const;
export const settlementExamples = [4025, 3990, null] as const;

export function physicalDelivery(
	type: SettlementOptionType,
	contracts: number,
) {
	const shares = physicalTerms.sharesPerContract * contracts;
	return {
		sharesToHolder: type === "CALL" ? shares : -shares,
		cashToHolder: (type === "CALL" ? -1 : 1) * shares * physicalTerms.strike,
	};
}
export function exitOutcome(type: SettlementOptionType, route: ExitRoute) {
	return route === "close"
		? {
				remainingOptions: 0,
				exercised: false,
				sharesToHolder: 0,
				cashToHolder:
					physicalTerms.completedSalePerShare * physicalTerms.sharesPerContract,
			}
		: { remainingOptions: 0, exercised: true, ...physicalDelivery(type, 1) };
}

/** Calendar-day DTE. The last three stops all occur on the example's expiry date. */
export const exerciseSchedule = [
	{ en: "Two days before expiry", zh: "到期前两天", dte: 2, tradingOpen: true },
	{
		en: "Expiry day, before cutoffs",
		zh: "到期日，截止前",
		dte: 0,
		tradingOpen: true,
	},
	{
		en: "Specified exercise window",
		zh: "指定行权时段",
		dte: 0,
		tradingOpen: false,
	},
	{
		en: "After the exercise deadline",
		zh: "行权截止之后",
		dte: 0,
		tradingOpen: false,
	},
] as const;

export function exerciseWindow(style: ExerciseStyle, index: number) {
	const moment = exerciseSchedule[index];
	if (!moment) throw new Error("Unknown teaching schedule stop");
	return {
		...moment,
		exerciseOpen: index < 3 && (style === "american" || index === 2),
	};
}

export function cashSettlement(
	type: SettlementOptionType,
	officialReference: number | null,
	contracts: number,
) {
	if (officialReference === null)
		return { difference: null, payoffPoints: null, cash: null };
	const difference = officialReference - cashTerms.strike;
	const payoffPoints = Math.max(type === "CALL" ? difference : -difference, 0);
	return {
		difference,
		payoffPoints,
		cash: payoffPoints * cashTerms.dollarsPerPoint * contracts,
	};
}
