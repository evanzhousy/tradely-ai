import { XIcon } from "lucide-react";
import type { Locale } from "@/i18n/messages";
import type { EvidenceKind } from "../types";
import { EvidenceTag } from "../walkthrough";

export type PrintField = {
	id: string;
	label: string;
	value: string;
	/** One plain line on what this field says, or why it can't. */
	why: string;
	evidence: EvidenceKind;
	/** A value decoded part by part: each part with what it names. */
	parts?: readonly { text: string; names: string }[];
};

/**
 * One tape row opened up: every field of the print with its value, a plain line on what it
 * says, and where it comes from. Only shown once the learner has the playground: the fields
 * could answer a scene's prediction.
 */
export function PrintInspector({
	title,
	fields,
	locale,
	closeLabel,
	onClose,
}: {
	title: string;
	fields: readonly PrintField[];
	locale: Locale;
	closeLabel: string;
	onClose: () => void;
}) {
	return (
		<section
			className="wt-print"
			aria-label={title}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
		>
			<div className="wt-print-head">
				<p className="wt-print-title">{title}</p>
				<button
					type="button"
					className="wt-print-close"
					aria-label={closeLabel}
					onClick={onClose}
				>
					<XIcon aria-hidden="true" />
				</button>
			</div>
			<dl className="wt-print-fields">
				{fields.map((field) => (
					<div key={field.id} className="wt-print-field">
						<dt>{field.label}</dt>
						<dd>
							<span className="wt-print-value">{field.value}</span>
							{field.parts ? (
								<span className="wt-print-parts">
									{field.parts.map((part) => (
										<span key={part.names} className="wt-print-part">
											<span className="wt-print-part-text">{part.text}</span>
											<span className="wt-print-part-name">{part.names}</span>
										</span>
									))}
								</span>
							) : null}
							<span className="wt-print-why">{field.why}</span>
							<EvidenceTag kind={field.evidence} locale={locale} />
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
