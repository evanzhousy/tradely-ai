import "@tanstack/react-start/server-only";
import { exposureUnits } from "./exposure.server";
import { flowUnits } from "./flow.server";
import { foundationUnits } from "./foundations.server";
import { orientationUnits } from "./orientation.server";
import { portfolioUnits } from "./portfolio.server";
import { productionUnits } from "./production.server";
import { researchUnits } from "./research.server";
import { sizeAndExitUnit } from "./size-and-exit.server";
import { strikeAndExpiryUnit } from "./strike-and-expiry.server";
import { structureUnits } from "./structure.server";
import { workflowUnits } from "./workflows.server";
export const teachingUnits = [
	...orientationUnits,
	...foundationUnits,
	strikeAndExpiryUnit,
	...flowUnits,
	sizeAndExitUnit,
	...exposureUnits,
	...structureUnits,
	...researchUnits,
	...productionUnits,
	...portfolioUnits,
	...workflowUnits,
];
export const getTeachingUnit = (id: string) =>
	teachingUnits.find((unit) => unit.id === id);
