import { Button } from "@tradely/ui/components/button";
import { Component, type ReactNode } from "react";
import { capturePostHogExceptionWhenReady } from "@/analytics/client";
import type { Locale } from "@/i18n/messages";
import { isStaleBuildError, reloadForStaleBuild } from "@/lib/stale-build";

/** Optional lesson surfaces fail locally, preserving the rest of the public lesson. */
export class LessonSurfaceBoundary extends Component<
	{
		lessonId: string;
		surface: "visual" | "notes" | "recap";
		locale: Locale;
		children: ReactNode;
	},
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error: unknown) {
		void capturePostHogExceptionWhenReady(error, {
			source: "lesson_surface",
			operation: `${this.props.surface === "visual" ? "visual_lesson" : this.props.surface === "notes" ? "lesson_notes" : "lesson_recap"}_${isStaleBuildError(error) ? "import" : "render"}`,
			lesson_id: this.props.lessonId,
		});
		if (isStaleBuildError(error)) reloadForStaleBuild();
	}
	render() {
		if (!this.state.failed) return this.props.children;
		const zh = this.props.locale === "zh";
		const title =
			this.props.surface === "visual"
				? zh
					? "互动课程暂时无法加载"
					: "The interactive lesson could not load"
				: this.props.surface === "notes"
					? zh
						? "笔记暂时无法加载"
						: "The notes could not load"
					: zh
						? "回顾暂时无法加载"
						: "The recap could not load";
		return (
			<section
				role="alert"
				className="flex min-h-40 flex-col items-start justify-center gap-4 rounded-2xl border p-6"
			>
				<h2 className="font-semibold text-xl">{title}</h2>
				<p>
					{zh
						? "你仍可使用本课的其他部分或继续下一课。重新加载页面后可再次尝试。"
						: "You can still use the rest of this lesson or continue to the next lesson. Reload the page to try again."}
				</p>
				<Button onClick={() => window.location.reload()}>
					{zh ? "重新加载课程" : "Reload lesson"}
				</Button>
			</section>
		);
	}
}
