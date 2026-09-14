import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import type { GuestSaveIntent } from "@/domain/guest-learning";
import type { Locale } from "@/i18n/messages";
import { guestSaveCopy as copy } from "./guest-save-copy";

export type GuestSaveControlProps = {
	onSave: (intent: GuestSaveIntent) => void;
	onDismiss: () => void;
	prominent: boolean;
	storageError: boolean;
};
export function GuestSaveControl({
	control,
	locale,
	complete,
	research,
	disabled,
	dirty,
}: {
	control: GuestSaveControlProps;
	locale: Locale;
	complete: boolean;
	research: boolean;
	disabled: boolean;
	dirty: boolean;
}) {
	const intent = research ? "research" : complete ? "result" : "place";
	const actions = (
		<div className="flex flex-wrap items-center gap-3">
			<Button
				className="h-auto min-h-9 max-w-full whitespace-normal"
				variant={complete && control.prominent ? "default" : "outline"}
				disabled={disabled || dirty}
				onClick={() => control.onSave(intent)}
			>
				{copy[intent][locale]}
			</Button>
			{complete && control.prominent ? (
				<Button variant="ghost" onClick={control.onDismiss}>
					{copy.guest[locale]}
				</Button>
			) : null}
		</div>
	);
	return (
		<div className="flex flex-col gap-3" data-testid="guest-save-control">
			{complete && control.prominent ? (
				<Alert>
					<AlertTitle>{copy.title[locale]}</AlertTitle>
					<AlertDescription className="flex flex-col gap-3">
						<p>{copy.description[locale]}</p>
						{actions}
					</AlertDescription>
				</Alert>
			) : (
				actions
			)}
			{dirty ? (
				<p className="text-muted-foreground text-sm">{copy.dirty[locale]}</p>
			) : null}
			{control.storageError ? <p role="alert">{copy.storage[locale]}</p> : null}
		</div>
	);
}
