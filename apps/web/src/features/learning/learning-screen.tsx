import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@tradely/ui/components/field";
import { RadioGroup, RadioGroupItem } from "@tradely/ui/components/radio-group";
import { Separator } from "@tradely/ui/components/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@tradely/ui/components/table";
import {
	ArrowRightIcon,
	CheckIcon,
	CircleHelpIcon,
	RotateCcwIcon,
	ScanSearchIcon,
} from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { learningRollout } from "@/content/learning-rollout";
import type {
	LearningAction,
	LearningCopy,
	LearningFact,
	LearningFailure,
	LearningStepView,
	LearningView,
} from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	ContractExplorer,
	type ContractRenderer,
	type RendererChange,
} from "./contract-explorer";
import { learningCopy } from "./copy";
import { FlowStructureExplorer } from "./flow-structure-explorer";
import { ChangeHighlight, LessonMotion, LessonReveal } from "./lesson-motion";
import { MetricsExplorer } from "./metrics-explorer";
import { NeighborhoodComparison } from "./neighborhood-comparison";
import { PremiumExplorer } from "./premium-explorer";
import { QuotePositionExplorer } from "./quote-position-explorer";
import { ResearchConnections } from "./research-connections";
import { UniverseExplorer } from "./universe-explorer";

export type LearningScreenProps = {
	lessonId?: string;
	initialRenderer?: ContractRenderer;
	persistence?: "account" | "preview";
	onRendererChange?: RendererChange;
	locale: Locale;
	view: LearningView | null;
	busy: boolean;
	error: LearningFailure | null;
	onOpen: (restart?: boolean) => void;
	onAction: (action: LearningAction) => void;
	onRecover: () => void;
};

function Facts({
	facts,
	locale,
	emphasize = false,
}: {
	facts: LearningFact[];
	locale: Locale;
	emphasize?: boolean;
}) {
	return (
		<Table>
			<TableBody>
				{facts.map((fact) => (
					<TableRow key={fact.label.en}>
						<TableHead scope="row" className="w-1/3 whitespace-normal">
							{fact.label[locale]}
						</TableHead>
						<TableCell className="whitespace-normal break-words">
							{emphasize ? (
								<ChangeHighlight value={fact.value[locale]}>
									{fact.value[locale]}
								</ChangeHighlight>
							) : (
								fact.value[locale]
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function QuoteComparison({
	quote,
	locale,
}: {
	quote: NonNullable<LearningStepView["quote"]>;
	locale: Locale;
}) {
	const text = (key: keyof typeof learningCopy) => learningCopy[key][locale];
	const ratio = (quote.trade - quote.bid) / (quote.ask - quote.bid);
	const fraction = Math.max(0, Math.min(1, ratio));
	const price = (value: number) => `$${value.toFixed(2)}`;
	return (
		<figure
			className="flex min-w-0 flex-col gap-3"
			aria-label={`${text("bid")} ${price(quote.bid)}, ${text("ask")} ${price(quote.ask)}, ${text("trade")} ${price(quote.trade)}`}
		>
			<div className="text-muted-foreground text-sm">{text("quoteAxis")}</div>
			<div className="mx-2 pt-8" aria-hidden="true">
				<div className="relative h-1 rounded-full bg-border">
					<div
						className="absolute -top-8 whitespace-nowrap font-medium text-sm"
						style={{
							left: `${fraction * 100}%`,
							transform: `translateX(-${fraction * 100}%)`,
						}}
					>
						{text("trade")} {price(quote.trade)}
					</div>
					<span
						className="absolute -top-1 size-3 rounded-full bg-primary"
						style={{
							left: `${fraction * 100}%`,
							transform: "translateX(-50%)",
						}}
					/>
				</div>
				<div className="mt-3 flex justify-between gap-4 text-sm tabular-nums">
					<span>
						{text("bid")} {price(quote.bid)}
					</span>
					<span>
						{text("ask")} {price(quote.ask)}
					</span>
				</div>
			</div>
			<figcaption className="text-muted-foreground text-sm">
				{quote.caption[locale]}
			</figcaption>
		</figure>
	);
}

function LearningScreenContent({
	lessonId,
	initialRenderer,
	persistence = "account",
	onRendererChange,
	locale,
	view,
	busy,
	error,
	onOpen,
	onAction,
	onRecover,
}: LearningScreenProps) {
	const id = useId();
	const release =
		learningRollout[lessonId ?? view?.lessonId ?? "validate-option-print"];
	const heading = useRef<HTMLHeadingElement>(null);
	const errorPanel = useRef<HTMLDivElement>(null);
	const text = (key: keyof typeof learningCopy) => learningCopy[key][locale];
	const local = (value: LearningCopy) => value[locale];
	const answering = view?.phase === "answer";
	const ready =
		!!view &&
		view.step.questions.every((question) => view.answers[question.id]) &&
		view.step.evidence.every(
			(evidence) => !evidence.required || evidence.detail,
		);
	const locked = busy || error !== null;
	const focusKey = view
		? `${view.attemptId}:${view.stepIndex}:${view.phase}`
		: "";
	useEffect(() => {
		if (focusKey) heading.current?.focus();
	}, [focusKey]);
	useEffect(() => {
		if (error) errorPanel.current?.focus();
	}, [error]);

	return (
		<Card
			id="interactive-practice"
			data-learning-persistence={persistence}
			aria-labelledby={`${id}-title`}
		>
			<CardHeader>
				<div className="mb-2 flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{text("label")}</Badge>
					<Badge variant="outline">{text("synthetic")}</Badge>
					<span className="text-muted-foreground text-xs">
						{text("stages")}
					</span>
				</div>
				<CardTitle>
					<h2 id={`${id}-title`}>{release?.title[locale] ?? text("label")}</h2>
				</CardTitle>
				<CardDescription>{release?.intro[locale]}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{error ? (
					<Alert ref={errorPanel} tabIndex={-1} variant="destructive">
						<AlertTitle>{text("errorTitle")}</AlertTitle>
						<AlertDescription>
							<p>{text(error)}</p>
							<Button variant="outline" onClick={onRecover} disabled={busy}>
								<RotateCcwIcon data-icon="inline-start" />
								{error === "conflict" || error === "invalid_action"
									? text("reload")
									: error === "retired"
										? text("restart")
										: text(view ? "retry" : "retryOpen")}
							</Button>
						</AlertDescription>
					</Alert>
				) : null}
				{view ? (
					<>
						<ol className="flex flex-wrap gap-2" aria-label={text("stages")}>
							{(
								view.stepKinds ??
								(["prediction", "guided", "independent"] as const)
							).map((step, index) => (
								<li
									key={step + index}
									aria-current={view.stepIndex === index ? "step" : undefined}
								>
									<Badge
										variant={view.stepIndex === index ? "default" : "outline"}
									>
										{index + 1}. {text(step)}
									</Badge>
								</li>
							))}
						</ol>
						<LessonReveal
							key={view.attemptId + view.step.id + view.phase}
							className="flex flex-col gap-2"
						>
							<h3
								ref={heading}
								tabIndex={-1}
								className="font-medium text-xl focus-visible:outline-offset-4"
							>
								{answering
									? local(view.step.title)
									: view.result
										? text(view.result.status)
										: text("debrief")}
							</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{local(view.step.brief)}
							</p>
						</LessonReveal>
						{view.initialJudgment && view.step.kind === "guided" ? (
							<Alert>
								<AlertTitle>{text("initial")}</AlertTitle>
								<AlertDescription>
									{local(view.initialJudgment)}
								</AlertDescription>
							</Alert>
						) : null}
						{view.step.facts.length > 0 ? (
							<Facts facts={view.step.facts} locale={locale} />
						) : null}
						{view.step.neighborhood ? (
							<ContractExplorer
								key={`${view.attemptId}:${view.step.id}:${view.step.neighborhood.id}`}
								data={view.step.neighborhood}
								locale={locale}
								allowThree={release?.three ?? false}
								initialRenderer={initialRenderer}
								onRendererChange={onRendererChange}
							/>
						) : null}
						{view.step.neighborhoodPair ? (
							<NeighborhoodComparison
								key={view.attemptId + view.step.id}
								data={view.step.neighborhoodPair}
								allowThree={release?.three ?? false}
								locale={locale}
								onRendererChange={onRendererChange}
							/>
						) : null}
						{view.step.metrics ? (
							<MetricsExplorer
								key={view.attemptId + view.step.id}
								data={view.step.metrics}
								allowThree={release?.three ?? false}
								locale={locale}
								onRendererChange={onRendererChange}
							/>
						) : null}
						{view.step.universe ? (
							<UniverseExplorer
								key={view.attemptId + view.step.id}
								data={view.step.universe}
								locale={locale}
							/>
						) : null}
						{view.step.quote ? (
							<div className="flex flex-col gap-4">
								<QuoteComparison quote={view.step.quote} locale={locale} />
								<QuotePositionExplorer
									key={view.step.id}
									quote={view.step.quote}
									locale={locale}
								/>
								<PremiumExplorer
									key={view.step.id}
									price={view.step.quote.trade}
									locale={locale}
								/>
							</div>
						) : null}
						{view.step.flowStructure ? (
							<FlowStructureExplorer
								key={`${view.attemptId}:${view.step.id}:${view.step.flowStructure.id}`}
								data={view.step.flowStructure}
								locale={locale}
							/>
						) : null}
						{view.step.evidence.length > 0 ? (
							<section
								className="flex flex-col gap-4"
								aria-labelledby={`${id}-evidence`}
							>
								<h4 id={`${id}-evidence`} className="font-medium text-sm">
									{text("evidence")}
								</h4>
								{view.step.evidence.map((evidence) => (
									<div className="flex flex-col gap-3" key={evidence.id}>
										{evidence.detail ? (
											<LessonReveal className="flex flex-col gap-3">
												<div className="flex flex-wrap items-center gap-2">
													<h5 className="font-medium text-sm">
														{local(evidence.title)}
													</h5>
													<Badge variant="outline">
														<CheckIcon data-icon="inline-start" />
														{text("inspected")}
													</Badge>
												</div>
												<Facts
													facts={evidence.detail.facts}
													locale={locale}
													emphasize={view.step.kind !== "independent"}
												/>
												<p className="text-sm leading-relaxed">
													{local(evidence.detail.note)}
												</p>
											</LessonReveal>
										) : (
											<Button
												variant="outline"
												className="self-start"
												disabled={locked || !answering}
												onClick={() =>
													onAction({ type: "inspect", evidenceId: evidence.id })
												}
											>
												<ScanSearchIcon data-icon="inline-start" />
												{local(evidence.title)}
											</Button>
										)}
										<Separator />
									</div>
								))}
							</section>
						) : null}
						{release?.showEvidenceLinks && view.step.evidence.length ? (
							<ResearchConnections view={view} locale={locale} />
						) : null}
						{answering ? (
							<FieldGroup>
								{view.step.questions.map((question) => (
									<FieldSet key={question.id} disabled={locked}>
										<FieldLegend id={`${id}-${question.id}`}>
											{local(question.prompt)}
										</FieldLegend>
										<RadioGroup
											aria-labelledby={`${id}-${question.id}`}
											value={view.answers[question.id] ?? ""}
											onValueChange={(value) => {
												if (typeof value === "string")
													onAction({
														type: "answer",
														questionId: question.id,
														choiceId: value,
													});
											}}
											disabled={locked}
										>
											{question.choices.map((choice) => (
												<FieldLabel
													key={choice.id}
													htmlFor={`${id}-${question.id}-${choice.id}`}
												>
													<Field
														orientation="horizontal"
														data-disabled={locked}
													>
														<RadioGroupItem
															id={`${id}-${question.id}-${choice.id}`}
															value={choice.id}
														/>
														<FieldContent>{local(choice.label)}</FieldContent>
													</Field>
												</FieldLabel>
											))}
										</RadioGroup>
									</FieldSet>
								))}
							</FieldGroup>
						) : (
							<section
								className="flex flex-col gap-5"
								aria-label={text("debrief")}
							>
								{view.feedback.map((criterion) => (
									<LessonReveal
										key={criterion.questionId}
										className="flex flex-col gap-2"
									>
										<Badge
											variant={criterion.met ? "secondary" : "outline"}
											className="self-start"
										>
											{text(criterion.met ? "met" : "revisit")}
										</Badge>
										<h4 className="font-medium text-sm">
											{local(criterion.prompt)}
										</h4>
										<p className="text-muted-foreground text-sm">
											{text("yourAnswer")}: {local(criterion.selected)}
										</p>
										<p className="text-sm leading-relaxed">
											{local(criterion.explanation)}
										</p>
									</LessonReveal>
								))}
							</section>
						)}
						{view.step.hint ? (
							<Alert>
								<CircleHelpIcon />
								<AlertTitle>{text("hint")}</AlertTitle>
								<AlertDescription>{local(view.step.hint)}</AlertDescription>
							</Alert>
						) : null}
						{view.result ? (
							<Alert>
								<CheckIcon />
								<AlertTitle>
									{text("criteria")}: {view.result.met} / {view.result.total}
								</AlertTitle>
								<AlertDescription>
									{view.result.usedHint ? <p>{text("hinted")}</p> : null}
									<p>{text("completeNote")}</p>
								</AlertDescription>
							</Alert>
						) : null}
					</>
				) : null}
			</CardContent>
			<CardFooter className="flex-col items-stretch gap-3">
				<div className="flex flex-wrap items-center gap-3">
					{!view ? (
						<Button onClick={() => onOpen()} disabled={locked}>
							<ArrowRightIcon data-icon="inline-end" />
							{busy ? text("loading") : text("start")}
						</Button>
					) : answering ? (
						<>
							<Button
								disabled={locked || !ready}
								onClick={() => onAction({ type: "submit" })}
							>
								{view.step.kind === "prediction"
									? text("commit")
									: text("submit")}
								<ArrowRightIcon data-icon="inline-end" />
							</Button>
							{!view.step.hint ? (
								<Button
									variant="ghost"
									disabled={locked}
									onClick={() => onAction({ type: "hint" })}
								>
									<CircleHelpIcon data-icon="inline-start" />
									{text("help")}
								</Button>
							) : null}
						</>
					) : view.phase === "complete" ? (
						<Button
							variant="outline"
							disabled={locked}
							onClick={() => onOpen(true)}
						>
							<RotateCcwIcon data-icon="inline-start" />
							{text("tryAgain")}
						</Button>
					) : (
						<Button
							disabled={locked}
							onClick={() => onAction({ type: "continue" })}
						>
							{(view.stepKinds?.[view.stepIndex + 1] ??
								(view.stepIndex === 1 ? "independent" : "guided")) ===
							"independent"
								? text("independentNext")
								: text("next")}
							<ArrowRightIcon data-icon="inline-end" />
						</Button>
					)}
				</div>
				{view && answering && !ready && !error ? (
					<p className="text-muted-foreground text-xs">{text("incomplete")}</p>
				) : null}
				<p
					role="status"
					aria-live="polite"
					className="min-h-4 text-muted-foreground text-xs"
				>
					{view
						? busy
							? text("saving")
							: error
								? ""
								: text(persistence === "preview" ? "previewOnly" : "saved")
						: busy
							? text("loading")
							: ""}
				</p>
			</CardFooter>
		</Card>
	);
}

export function LearningScreen(props: LearningScreenProps) {
	return (
		<LessonMotion>
			<LearningScreenContent {...props} />
		</LessonMotion>
	);
}
