import { getRouteApi } from "@tanstack/react-router";

import { DEFAULT_LOCALE, type Locale } from "./locale";

const rootRoute = getRouteApi("__root__");

export function useLocale(): Locale {
	return rootRoute.useRouteContext().locale ?? DEFAULT_LOCALE;
}
