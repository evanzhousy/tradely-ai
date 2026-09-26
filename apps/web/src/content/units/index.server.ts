import "@tanstack/react-start/server-only";
import { exposureUnits } from "./exposure.server";
import { flowUnits } from "./flow.server";
import { foundationUnits } from "./foundations.server";
import { orientationUnits } from "./orientation.server";
import { portfolioUnits } from "./portfolio.server";
import { productionUnits } from "./production.server";
import { researchUnits } from "./research.server";
import { structureUnits } from "./structure.server";
export const teachingUnits = [
	...orientationUnits,
	...foundationUnits,
	...flowUnits,
	...exposureUnits,
	...structureUnits,
	...researchUnits,
	...productionUnits,
	...portfolioUnits,
];
export const getTeachingUnit = (id: string) =>
	teachingUnits.find((unit) => unit.id === id);
