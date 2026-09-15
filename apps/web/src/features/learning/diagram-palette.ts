export type DiagramPalette =
	| "reference"
	| "positive"
	| "negative"
	| "caution"
	| "model"
	| "neutral";

const paletteByLesson: Record<string, DiagramPalette> = {
	"option-contracts": "reference",
	"option-rights": "positive",
	"premium-payoff": "positive",
	"expiration-settlement": "caution",
	"quotes-orders-trades": "reference",
	"execution-counterparties": "reference",
	"execution-side": "positive",
	"flow-sentiment": "positive",
	"validate-option-print": "caution",
	"session-flow-vs-structure": "reference",
	"trade-records": "reference",
	"unusual-activity": "caution",
	"option-strategies": "model",
	"symbol-drawer": "reference",
	delta: "positive",
	gamma: "model",
	"theta-vega-rho": "model",
	"implied-realized-volatility": "model",
	"volatility-surface": "model",
	"iv-rank-percentile": "reference",
	"dex-dei-gex": "positive",
	"gamma-exposure": "model",
	"gamma-regimes": "caution",
	"structural-levels": "model",
	"charm-vanna": "model",
	"audited-boundary": "reference",
	"symbol-universe": "positive",
	"rank-symbols": "reference",
	"rank-contracts": "model",
	"point-in-time-research": "caution",
	"cookbook-research-packet": "reference",
	"market-recap": "positive",
	"audit-market-recap": "negative",
	"portfolio-pnl": "positive",
	"portfolio-performance": "model",
	"portfolio-exposure": "model",
};

export function getDiagramPalette(subject: string): DiagramPalette {
	return paletteByLesson[subject] ?? "reference";
}
