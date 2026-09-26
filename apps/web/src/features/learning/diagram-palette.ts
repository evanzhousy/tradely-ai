export type DiagramPalette =
	| "reference"
	| "positive"
	| "negative"
	| "caution"
	| "model"
	| "neutral";

const paletteByLesson: Record<string, DiagramPalette> = {
	"option-contracts": "reference",
	"option-rights": "reference",
	"premium-payoff": "reference",
	"expiration-settlement": "reference",
	"quotes-orders-trades": "reference",
	"execution-counterparties": "reference",
	"execution-side": "reference",
	"flow-sentiment": "reference",
	"validate-option-print": "reference",
	"session-flow-vs-structure": "reference",
	"trade-records": "reference",
	"execution-conditions": "reference",
	"unusual-activity": "reference",
	"option-strategies": "model",
	"symbol-drawer": "reference",
	delta: "model",
	gamma: "model",
	"theta-vega-rho": "model",
	"implied-realized-volatility": "model",
	"volatility-surface": "model",
	"iv-rank-percentile": "reference",
	"dex-dei-gex": "model",
	"gamma-exposure": "model",
	"gamma-regimes": "model",
	"structural-levels": "model",
	"charm-vanna": "model",
	"audited-boundary": "reference",
	"symbol-universe": "reference",
	"rank-symbols": "reference",
	"rank-contracts": "model",
	"point-in-time-research": "reference",
	"cookbook-research-packet": "reference",
	"market-recap": "reference",
	"audit-market-recap": "reference",
	"portfolio-pnl": "reference",
	"portfolio-performance": "model",
	"portfolio-exposure": "model",
};

export function getDiagramPalette(subject: string): DiagramPalette {
	return paletteByLesson[subject] ?? "reference";
}
