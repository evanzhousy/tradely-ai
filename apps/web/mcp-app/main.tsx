import "./zod-jitless";
import { App, type McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { Button } from "@tradely/ui/components/button";
import {
	Component,
	type ComponentType,
	type ReactNode,
	useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import {
	AnalyticsContext,
	type AnalyticsContextValue,
} from "@/analytics/context";
import {
	isMcpLesson,
	lessonUrl,
	type McpLessonSlug,
} from "@/content/mcp-lessons";
import { syllabus } from "@/content/syllabus";
import { getDiagramPalette } from "@/features/learning/diagram-palette";
import { LessonMotion } from "@/features/learning/lesson-motion";
import { DeltaWalkthrough } from "@/features/learning/lessons/delta";
import { GammaExposureWalkthrough } from "@/features/learning/lessons/gamma-exposure";
import { ImpliedRealizedVolatilityWalkthrough } from "@/features/learning/lessons/implied-realized-volatility";
import { PremiumPayoffWalkthrough } from "@/features/learning/lessons/premium-payoff";
import { WhatOptionsAreWalkthrough } from "@/features/learning/lessons/what-options-are";
import type { Locale } from "@/i18n/messages";
import "./viewer.css";

const lessons: Record<McpLessonSlug, ComponentType<{ locale: Locale }>> = {
	"what-options-are": WhatOptionsAreWalkthrough,
	"premium-payoff": PremiumPayoffWalkthrough,
	delta: DeltaWalkthrough,
	"gamma-exposure": GammaExposureWalkthrough,
	"implied-realized-volatility": ImpliedRealizedVolatilityWalkthrough,
};

const copy = {
	open: {
		en: "Open the full lesson on Tradely",
		zh: "在 Tradely 打开完整课程",
	},
	waiting: { en: "Loading lesson…", zh: "正在加载课程…" },
	unknown: {
		en: "This lesson can't be shown here.",
		zh: "这节课无法在这里显示。",
	},
	failed: {
		en: "This lesson couldn't run here.",
		zh: "这节课无法在这里运行。",
	},
} satisfies Record<string, Record<Locale, string>>;

/**
 * The view records nothing: it has no consent banner, and the assistant's sandbox blocks every
 * outside origin. The player's capture calls are accepted and dropped.
 */
const noAnalytics: AnalyticsContextValue = {
	consent: "denied",
	isCapturing: false,
	isPostHogCapturing: false,
	isConsentResolved: true,
	isConfigured: false,
	preferencesOpen: false,
	capture: () => false,
	capturePageView: () => false,
	countAnonymousPageView: () => false,
	captureException: () => false,
	identify: () => false,
	resetIdentity: () => {},
	setConsent: () => {},
	openPreferences: () => {},
	closePreferences: () => {},
};

type Selection = {
	lesson: McpLessonSlug | "unknown" | null;
	locale: Locale | null;
	hostLocale: Locale;
};

let selection: Selection = { lesson: null, locale: null, hostLocale: "en" };
const listeners = new Set<() => void>();
const update = (next: Partial<Selection>) => {
	selection = { ...selection, ...next };
	for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

/** Tool arguments and the tool's structured result carry the same `lesson` and `locale`. */
function select(value: unknown) {
	if (!value || typeof value !== "object") return;
	const { lesson, locale } = value as Record<string, unknown>;
	if (lesson !== undefined)
		update({ lesson: isMcpLesson(lesson) ? lesson : "unknown" });
	if (locale === "en" || locale === "zh") update({ locale });
}

function applyHostContext(context: McpUiHostContext | undefined) {
	if (!context) return;
	if (context.theme)
		document.documentElement.classList.toggle("dark", context.theme === "dark");
	if (context.locale)
		update({
			hostLocale: context.locale.toLowerCase().startsWith("zh") ? "zh" : "en",
		});
}

const app = new App({ name: "Tradely lessons", version: "1.0.0" });
app.ontoolinput = (params) => select(params.arguments);
app.ontoolresult = (result) => select(result.structuredContent);
app.onhostcontextchanged = (context) => applyHostContext(context);
app.onteardown = async () => ({});

const openLesson = (slug: McpLessonSlug) => {
	void app.openLink({ url: lessonUrl(slug) }).catch(() => undefined);
};

class LessonBoundary extends Component<
	{ children: ReactNode; fallback: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

function Viewer() {
	const {
		lesson,
		locale: chosen,
		hostLocale,
	} = useSyncExternalStore(subscribe, () => selection);
	const locale = chosen ?? hostLocale;
	if (lesson === null)
		return (
			<p role="status" className="p-4 text-muted-foreground text-sm">
				{copy.waiting[locale]}
			</p>
		);
	if (lesson === "unknown")
		return (
			<p role="alert" className="p-4 text-sm">
				{copy.unknown[locale]}
			</p>
		);
	const Lesson = lessons[lesson];
	const entry = syllabus.find((item) => item.id === lesson);
	const title = entry
		? locale === "zh"
			? entry.titleZh
			: entry.title
		: lesson;
	const open = (
		<Button size="sm" variant="secondary" onClick={() => openLesson(lesson)}>
			{copy.open[locale]}
		</Button>
	);
	return (
		<main
			className="flex flex-col gap-3 p-3"
			lang={locale === "zh" ? "zh-Hans" : "en"}
		>
			<header className="flex flex-wrap items-center justify-between gap-2">
				<div className="min-w-0">
					<p className="text-muted-foreground text-xs">Tradely</p>
					<h1 className="font-semibold text-base">{title}</h1>
				</div>
				{open}
			</header>
			<LessonBoundary
				key={`${lesson}:${locale}`}
				fallback={
					<div
						role="alert"
						className="flex flex-col items-start gap-2 p-1 text-sm"
					>
						<p>{copy.failed[locale]}</p>
						{open}
					</div>
				}
			>
				<div
					className="visual-color-system"
					data-visual-palette={getDiagramPalette(lesson)}
				>
					<LessonMotion>
						<Lesson locale={locale} />
					</LessonMotion>
				</div>
			</LessonBoundary>
		</main>
	);
}

const root = document.getElementById("root");
if (root)
	createRoot(root).render(
		<AnalyticsContext.Provider value={noAnalytics}>
			<Viewer />
		</AnalyticsContext.Provider>,
	);

app
	.connect()
	.then(() => applyHostContext(app.getHostContext()))
	.catch(() => undefined);
