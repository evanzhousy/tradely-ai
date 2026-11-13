import "@tanstack/react-start/server-only";
import { dealersAndHedgingUnit } from "./dealers-and-hedging.server";
import { exposureUnits } from "./exposure.server";
import { firstSpreadTradeUnit } from "./first-spread-trade.server";
import { flowUnits } from "./flow.server";
import { foundationUnits } from "./foundations.server";
import { orientationUnits } from "./orientation.server";
import { portfolioUnits } from "./portfolio.server";
import { productionUnits } from "./production.server";
import { researchUnits } from "./research.server";
import { sellingCoveredOptionsUnit } from "./selling-covered-options.server";
import { sizeAndExitUnit } from "./size-and-exit.server";
import { strikeAndExpiryUnit } from "./strike-and-expiry.server";
import { structureUnits } from "./structure.server";
import { workflowUnits } from "./workflows.server";
export const teachingUnits = [
	...orientationUnits,
	...foundationUnits,
	strikeAndExpiryUnit,
	...flowUnits,
	firstSpreadTradeUnit,
	sellingCoveredOptionsUnit,
	sizeAndExitUnit,
	...exposureUnits,
	dealersAndHedgingUnit,
	...structureUnits,
	...researchUnits,
	...productionUnits,
	...portfolioUnits,
	...workflowUnits,
];
export const getTeachingUnit = (id: string) =>
	teachingUnits.find((unit) => unit.id === id);
