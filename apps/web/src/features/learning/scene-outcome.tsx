import { Surface } from "@tradely/ui/components/surface";
import type { ReactNode } from "react";
import { useContext } from "react";
import type { Locale } from "@/i18n/messages";
import { VisualPlayback } from "./visual-playback";

export type OutcomeItem = {
	id: string;
	label: ReactNode;
	value: ReactNode;
	unit?: string;
	tone?: "gain" | "loss" | "observed" | "estimated" | "unknown";
};
/** Values are supplied by the scene's model. Unknown values are never coerced to zero. */
export function SceneOutcome({
	items,
	note,
	locale,
}: {
	items: readonly OutcomeItem[];
	note?: ReactNode;
	locale: Locale;
}) {
	const playback = useContext(VisualPlayback);
	return (
		<section
			className="outcome-summary"
			aria-label={locale === "zh" ? "关键结果" : "Key result"}
			aria-live={playback?.playing ? "off" : "polite"}
		>
			<dl className="outcome-grid">
				{items.map((item) => (
					<Surface
						key={item.id}
						variant="secondary"
						className="scene-outcome-card"
						data-outcome={item.id}
						data-tone={
							item.value === null || item.value === undefined
								? "unknown"
								: item.tone
						}
					>
						<dt className="scene-outcome-label">{item.label}</dt>
						<dd className="scene-outcome-value">
							{item.value ?? "—"}
							{item.unit ? (
								<span className="outcome-unit"> {item.unit}</span>
							) : null}
						</dd>
					</Surface>
				))}
			</dl>
			{note ? <p className="outcome-note">{note}</p> : null}
		</section>
	);
}
