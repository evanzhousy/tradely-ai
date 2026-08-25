import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import Loader from "./components/loader";
import { DEFAULT_LOCALE } from "./i18n/locale";
import { t } from "./i18n/ui";
import { routeTree } from "./routeTree.gen";

function NotFound() {
	return <div>{t(DEFAULT_LOCALE, "notFound")}</div>;
}

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { locale: DEFAULT_LOCALE },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: NotFound,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
