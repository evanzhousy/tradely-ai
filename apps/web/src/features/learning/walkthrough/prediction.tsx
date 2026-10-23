import { Button } from "@tradely/ui/components/button";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import { CheckIcon, XIcon } from "lucide-react";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { TermText } from "../term-text";
import { formatEntry, judge, parseEntry, seededOrder } from "./answers";
import { useTeachMotion } from "./stage";
import type { Prediction } from "./types";

export const predictionCopy = {
	predictFirst: ["Predict first", "先预测"],
	right: ["You predicted it", "预测正确"],
	wrong: ["Not quite", "与预测不同"],
	youChose: ["You chose: ", "你的选择："],
	yourAnswer: ["Your answer", "你的答案"],
	check: ["Check my answer", "核对答案"],
	entryHelp: [
		"One number, such as 1260 or -2.5.",
		"填一个数值，例如 1260 或 -2.5。",
	],
	notNumber: [
		"That isn't one number. Try, for example, 1260 or -2.5.",
		"这不是一个数值。例如可以填 1260 或 -2.5。",
	],
	pickInstead: ["Choose from options instead", "改为从选项中选择"],
	typeInstead: ["Type a number instead", "改为填写数值"],
	youEntered: ["You entered: ", "你填写的是："],
	answerWas: ["The answer: ", "答案："],
} as const satisfies Record<string, Copy>;

/**
 * The question a scene asks before it shows its answer: a choice, or a typed number with
 * the choices as a fallback. `onChoose` gets a choice id or "entry:<number>".
 */
export function PredictPanel({
	prediction,
	seed,
	locale,
	skip,
	onChoose,
	onSkip,
}: {
	prediction: Prediction;
	/** Fixes the order of the choices, so the right one isn't always first. */
	seed: string;
	locale: Locale;
	/** The quiet way past the question, such as "Skip and watch". */
	skip: Copy;
	onChoose: (answer: string) => void;
	onSkip: () => void;
}) {
	const t = (value: Copy) => pick(value, locale);
	const copy = predictionCopy;
	const entryId = useId();
	const [draft, setDraft] = useState("");
	const [invalid, setInvalid] = useState(false);
	const [choosing, setChoosing] = useState(false);
	const entry = prediction.entry;
	const typing = !!entry && !choosing;
	return (
		<div className="wt-panel" data-kind="predict">
			<p className="wt-panel-title">{t(copy.predictFirst)}</p>
			{typing && entry ? (
				<form
					className="wt-entry"
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						const value = parseEntry(draft);
						setInvalid(value === null);
						if (value !== null) onChoose(`entry:${value}`);
					}}
				>
					<Field data-invalid={invalid || undefined}>
						<FieldLabel htmlFor={entryId}>{t(copy.yourAnswer)}</FieldLabel>
						<div className="wt-entry-row">
							{entry.prefix ? (
								<span className="wt-entry-unit">{entry.prefix}</span>
							) : null}
							<Input
								id={entryId}
								inputMode="decimal"
								autoComplete="off"
								maxLength={24}
								value={draft}
								aria-invalid={invalid || undefined}
								aria-describedby={`${entryId}-help`}
								onChange={(event) => {
									setDraft(event.target.value);
									setInvalid(false);
								}}
							/>
							{entry.unit ? (
								<span className="wt-entry-unit">{t(entry.unit).trim()}</span>
							) : null}
						</div>
						<p
							id={`${entryId}-help`}
							className="wt-panel-note"
							role={invalid ? "alert" : undefined}
						>
							{invalid ? t(copy.notNumber) : t(copy.entryHelp)}
						</p>
					</Field>
					<Button type="submit" size="sm" className="self-start">
						{t(copy.check)}
					</Button>
				</form>
			) : (
				<div className="wt-choices">
					{seededOrder(prediction.choices, seed).map((item) => (
						<Button
							key={item.id}
							variant="outline"
							className="wt-choice"
							data-choice={item.id}
							onClick={() => onChoose(item.id)}
						>
							{t(item.label)}
						</Button>
					))}
				</div>
			)}
			{entry ? (
				<button
					type="button"
					className="wt-link"
					onClick={() => setChoosing((value) => !value)}
				>
					{typing ? t(copy.pickInstead) : t(copy.typeInstead)}
				</button>
			) : null}
			<button type="button" className="wt-link" onClick={onSkip}>
				{t(skip)}
			</button>
		</div>
	);
}

/**
 * The verdict on a committed prediction: right or not, what the learner gave, why a wrong
 * choice misses, the answer to a mistyped number, and the explanation. It takes focus, so
 * it carries `data-focus="feedback"`.
 */
export function PredictionFeedback({
	prediction,
	answer,
	locale,
}: {
	prediction: Prediction;
	answer: string;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const copy = predictionCopy;
	const motion = useTeachMotion();
	const verdict = judge(prediction, answer);
	const choice = prediction.choices.find((item) => item.id === answer);
	const entry = prediction.entry;
	const asEntry = (value: number) =>
		formatEntry(value, {
			prefix: entry?.prefix,
			suffix: entry?.unit ? t(entry.unit) : undefined,
		});
	return (
		<m.div
			className="wt-panel"
			data-kind={verdict.correct ? "right" : "wrong"}
			data-focus="feedback"
			style={
				verdict.correct
					? undefined
					: {
							borderColor:
								"color-mix(in oklab, var(--tone-down) 60%, var(--border))",
						}
			}
			tabIndex={-1}
			initial={motion.enabled ? { opacity: 0, y: 6 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={motion.fade}
		>
			<p
				className="wt-panel-title flex items-center gap-1.5"
				style={{
					color: verdict.correct ? "var(--tone-up)" : "var(--tone-down)",
				}}
			>
				{verdict.correct ? (
					<CheckIcon className="size-4" aria-hidden="true" />
				) : (
					<XIcon className="size-4" aria-hidden="true" />
				)}
				{verdict.correct ? t(copy.right) : t(copy.wrong)}
			</p>
			<p className="wt-panel-note">
				{verdict.typed !== undefined
					? `${t(copy.youEntered)}${asEntry(verdict.typed)}`
					: choice
						? `${t(copy.youChose)}${t(choice.label)}`
						: null}
			</p>
			{!verdict.correct && choice?.why ? (
				<p className="wt-panel-why">
					<TermText text={t(choice.why)} locale={locale} />
				</p>
			) : null}
			{verdict.typed !== undefined && !verdict.correct && entry ? (
				<p className="wt-panel-note">
					{t(copy.answerWas)}
					{asEntry(entry.answer)}
				</p>
			) : null}
			<p>
				<TermText text={t(prediction.explain)} locale={locale} />
			</p>
		</m.div>
	);
}
