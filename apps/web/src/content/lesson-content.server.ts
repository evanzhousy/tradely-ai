import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/messages";
import { getTeachingUnit } from "./units/index.server";

export function getLessonBody(
	slug: string,
	locale: Locale = "en",
): string | undefined {
	const unit = getTeachingUnit(slug);
	if (!unit) return undefined;
	const heading = (en: string, zh: string) => (locale === "zh" ? zh : en);
	return [
		`## ${heading("Understand the concept", "理解概念")}`,
		unit.explanation[locale],
		`## ${heading("Worked example", "示例计算")}`,
		unit.example[locale],
		`## ${heading("Check the distinction", "检查关键区别")}`,
		unit.misconception[locale],
		`## ${heading("Background references", "背景参考")}`,
		...unit.sources.map((source) => `- [${source.title}](${source.href})`),
		heading(
			"All case numbers are authored teaching fixtures. Model conventions and assumptions are stated in the lesson; they are not observed positions or forecasts.",
			"案例数字均为编写的教学数据。模型约定与假设在课内明确说明，并非已观测持仓或预测。",
		),
	].join("\n\n");
}
