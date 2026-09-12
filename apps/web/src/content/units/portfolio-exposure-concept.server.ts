import "@tanstack/react-start/server-only";
import type { PortfolioExposureData } from "@/domain/learning/portfolio-exposure-concept";

const at = "2030-09-16 14:00 UTC";
export const portfolioExposureData: PortfolioExposureData = {
	kind: "portfolio-exposure",
	source: "PORTFOLIO-E · synthetic same-underlying snapshot",
	underlying: "XYZ",
	at,
	stock: 100,
	calls: {
		id: "2 short XYZ calls",
		quantity: 2,
		multiplier: 100,
		side: "short",
		greeks: { delta: 0.4, gamma: 0.02, theta: -0.03, vega: 0.12 },
		at,
		vegaScale: "point",
	},
	put: {
		id: "1 long XYZ put",
		quantity: 1,
		multiplier: 100,
		side: "long",
		greeks: { delta: -0.3, gamma: 0.015, theta: -0.02, vega: 0.1 },
		at,
		vegaScale: "point",
	},
	hedgeFrames: [0, -10, -20, 0],
	moveFrames: [0, 1, -1, 0],
};
