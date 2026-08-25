import type { UiKey } from "@/i18n/ui";

export const primaryNavigation: readonly {
	to: "/" | "/courses/tradingflow-foundations" | "/pricing";
	labelKey: UiKey;
}[] = [
	{ to: "/", labelKey: "navLearn" },
	{ to: "/courses/tradingflow-foundations", labelKey: "navCourse" },
	{ to: "/pricing", labelKey: "navPricing" },
];
