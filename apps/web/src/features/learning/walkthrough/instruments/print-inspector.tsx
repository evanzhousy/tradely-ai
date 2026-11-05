import {
	Popover,
	PopoverContent,
	PopoverDialog,
} from "@tradely/ui/components/popover";
import { XIcon } from "lucide-react";
import type { RefObject } from "react";
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
};

/**
 * One tape row opened up, in a card under the tape: nothing on the page moves, so the scene's
 * task stays where it was, and every row stays in reach to go from print to print. Only shown
 * once the learner has the playground: the fields could answer a scene's prediction.
 */
export function PrintInspector({
	title,
	fields,
	locale,
	closeLabel,
	anchor,
	onClose,
}: {
	title: string;
	fields: readonly PrintField[];
	locale: Locale;
	closeLabel: string;
	anchor: RefObject<Element | null>;
	onClose: () => void;
}) {
	return (
		// The root gives the popover its look; the card opens from the tape, not from a trigger.
		<Popover>
			<PopoverContent
				isOpen
				isNonModal
				triggerRef={anchor}
				placement="bottom"
				offset={6}
				shouldCloseOnInteractOutside={(element) =>
					!element.closest(".wt-tape-row")
				}
				onOpenChange={(open) => {
					if (!open) onClose();
				}}
				className="max-w-[min(22rem,calc(100vw-2rem))]"
			>
				<PopoverDialog aria-label={title} className="wt-print">
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
					<dl>
						{fields.map((field) => (
							<div key={field.id} className="wt-print-field">
								<dt>{field.label}</dt>
								<dd className="wt-print-value">{field.value}</dd>
								<dd className="wt-print-why">
									{field.why}{" "}
									<EvidenceTag kind={field.evidence} locale={locale} />
								</dd>
							</div>
						))}
					</dl>
				</PopoverDialog>
			</PopoverContent>
		</Popover>
	);
}
