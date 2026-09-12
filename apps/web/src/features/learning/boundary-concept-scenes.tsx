import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type BoundaryConceptData,
	changedQuestionFields,
	type EvidenceLayer,
	type QuestionField,
	questionDeclaration,
	requiredQuestionFields,
} from "@/domain/learning/boundary-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	PlaybackButton,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
export const BoundaryData = createContext<BoundaryConceptData | null>(null);
function useData() {
	const data = useContext(BoundaryData);
	if (!data)
		throw new Error(
			"Research boundary scenes require authorized teaching data",
		);
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
function Note({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-2xl border p-4 text-sm leading-relaxed">
			{children}
		</div>
	);
}
function Context({ locale }: Props) {
	const data = useData();
	return (
		<p className="font-mono text-muted-foreground text-xs">
			{data.source}
			<br />
			{copy(locale)(
				"Local exploration · no research record is saved",
				"本地探索 · 不保存研究记录",
			)}
		</p>
	);
}
export function BoundaryQuestionScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [forecast, setForecast] = useState(false);
	const required = requiredQuestionFields(forecast);
	const replay = useFrames(required.length + 1);
	const [manual, setManual] = useState<QuestionField[] | null>([
		"subject",
		"quantity",
		"universe",
	]);
	const selected = manual ?? required.slice(0, replay.frame);
	const [focus, setFocus] = useState<QuestionField>("interval");
	const state = questionDeclaration(selected, forecast);
	const active = data.fields.find((f) => f.id === focus) ?? data.fields[0];
	const enabled = useLessonMotion();
	const toggle = (id: QuestionField) => {
		replay.select(replay.frame);
		setManual(
			selected.includes(id)
				? selected.filter((v) => v !== id)
				: [...selected, id],
		);
		setFocus(id);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Research question declaration fields", "研究问题声明字段")}
					height={100 + required.length * 54}
				>
					<SvgText x={180} y={32}>
						{l("Declared fields", "已声明字段")}: {state.declared} /{" "}
						{required.length}
					</SvgText>
					{required.map((id, i) => {
						const field = data.fields.find((f) => f.id === id);
						const present = selected.includes(id);
						return (
							<g key={id}>
								<rect
									x={25}
									y={53 + i * 54}
									width={310}
									height={45}
									rx={10}
									fill={present ? "var(--primary)" : "currentColor"}
									opacity={present ? 0.18 : 0.05}
								/>
								<foreignObject x={25} y={53 + i * 54} width={310} height={45}>
									<button
										type="button"
										className="h-full w-full rounded-lg px-4 text-left text-sm"
										aria-pressed={present}
										onClick={() => toggle(id)}
									>
										{present ? "●" : "○"} {field?.label[language]}
									</button>
								</foreignObject>
							</g>
						);
					})}
					<m.rect
						x={25}
						y={65 + required.length * 54}
						width={(310 * state.declared) / required.length}
						height={8}
						rx={4}
						fill="var(--primary)"
						initial={false}
						animate={{ width: (310 * state.declared) / required.length }}
						transition={
							enabled && replay.playing ? lessonTransition : instantTransition
						}
					/>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Question type", "问题类型")}
				value={forecast ? "forecast" : "descriptive"}
				options={[
					["descriptive", l("Descriptive question", "描述性问题")],
					["forecast", l("Forecast design", "预测设计")],
				]}
				onChange={(value) => {
					setForecast(value === "forecast");
					replay.select(0);
					setManual(["subject", "quantity", "universe"]);
					setFocus(value === "forecast" ? "outcome" : "interval");
				}}
			/>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<SelectField
				label={l("Inspect a declaration", "检查声明")}
				value={focus}
				options={required.map((id) => [
					id,
					data.fields.find((f) => f.id === id)?.label[language] ?? id,
				])}
				onChange={(id) => setFocus(id as QuestionField)}
			/>
			<Note>
				<strong>{active.label[language]}</strong>
				<br />
				{active.value[language]}
				<br />
				{selected.includes(active.id)
					? l("Included in this design", "已纳入此设计")
					: l(
							"Not yet included; activate its SVG field to declare it",
							"尚未纳入；点击其 SVG 字段进行声明",
						)}
			</Note>
			<p data-boundary-declared>
				{state.declared} / {required.length}{" "}
				{l("fields declared", "字段已声明")}
			</p>
			<p data-boundary-missing>
				{state.missing.length
					? `${l("Still unspecified", "仍未明确")}: ${state.missing.map((id) => data.fields.find((f) => f.id === id)?.label[language]).join(" · ")}`
					: l(
							"Design fields declared; no finding or forecast has been validated",
							"设计字段已声明；未验证任何结论或预测",
						)}
			</p>
			<p>
				{forecast
					? l(
							"Forecast sketch: test whether a prespecified session-volume feature predicts RHO's positive next-session return. The supplied design has no evaluation results.",
							"预测草案：测试预先规定的时段成交量特征能否预测 RHO 下一时段正收益。给定设计没有评价结果。",
						)
					: l(
							"Descriptive sketch: where did RHO call volume concentrate among the three declared October 18 series during the specified September 13 session?",
							"描述草案：在指定 9 月 13 日时段内，RHO 看涨成交量在三个声明的 10 月 18 日序列中集中在哪里？",
						)}
			</p>
			<p className="text-muted-foreground text-xs">
				{l(
					"The sketch is not ready until its missing fields are declared. 'What will rally?' needs a measurable outcome, horizon and held-out evaluation; it is underspecified, not inherently untestable. This checklist does not certify data quality, prose or predictive skill.",
					"缺失字段声明前，草案尚未就绪。“什么会上涨”需要可测结果、期限与样本外评价；它是不够明确，并非本质不可检验。清单不认证数据质量、文字或预测能力。",
				)}
			</p>
		</SceneLayout>
	);
}
export function BoundaryEvidenceScene({ locale }: Props) {
	const data = useData();
	const language = locale === "zh" ? 1 : 0;
	const l = copy(locale);
	const [id, setId] = useState(data.cards[0].id);
	const [choice, setChoice] = useState<EvidenceLayer | null>(null);
	const card = data.cards.find((c) => c.id === id) ?? data.cards[0];
	const fits = choice !== null && card.accepted.includes(choice);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Statement and evidence categories", "陈述与证据类别")}
					height={470}
				>
					<foreignObject x={25} y={18} width={310} height={122}>
						<div className="flex h-full items-center rounded-xl border p-4 text-sm leading-relaxed">
							{card.statement[language]}
						</div>
					</foreignObject>
					{data.layers.map((layer, i) => (
						<g key={layer.id}>
							<rect
								x={25}
								y={155 + i * 54}
								width={310}
								height={44}
								rx={10}
								fill={choice === layer.id ? "var(--primary)" : "currentColor"}
								opacity={choice === layer.id ? 0.2 : 0.04}
							/>
							<foreignObject x={25} y={155 + i * 54} width={310} height={44}>
								<button
									type="button"
									className="h-full w-full rounded-lg text-sm"
									aria-pressed={choice === layer.id}
									onClick={() => setChoice(layer.id)}
								>
									{layer.label[language]}
								</button>
							</foreignObject>
						</g>
					))}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Evidence statement", "证据陈述")}
				value={id}
				options={data.cards.map((c) => [c.id, c.label[language]])}
				onChange={(value) => {
					setId(value);
					setChoice(null);
				}}
			/>
			<p data-boundary-category role="status">
				{choice === null
					? l(
							"Choose a category to inspect the reasoning",
							"选择类别以检查理由",
						)
					: fits
						? l("This role fits the supplied statement", "此作用符合给定陈述")
						: l(
								"This category does not capture the supplied assertion",
								"此类别未表达给定断言",
							)}
			</p>
			{choice !== null && (
				<Note>
					{card.explanation[language]}
					<br />
					{l("Supported roles here", "此处支持的作用")}:{" "}
					{card.accepted
						.map(
							(id) =>
								data.layers.find((layer) => layer.id === id)?.label[language],
						)
						.join(" / ")}
				</Note>
			)}
			<p className="text-muted-foreground text-xs">
				{l(
					"Categories describe how evidence is being used. A correction may be both an observed fact and a contradiction; a reported gap is observed while its missing volume stays unknown. This local exercise does not score mastery or classify arbitrary real-world text.",
					"类别描述证据如何使用。更正既可为观测事实，也可为反证；报告缺口可观测，但缺失成交量仍未知。此本地练习不计掌握分数，也不分类任意真实文字。",
				)}
			</p>
		</SceneLayout>
	);
}
export function BoundaryRevisionScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [id, setId] = useState(data.revisions[0].id);
	const replay = useFrames(3);
	const revision = data.revisions.find((r) => r.id === id) ?? data.revisions[0];
	const changes = changedQuestionFields(
		data.original.identity,
		revision.identity,
	);
	const fork = changes.length > 0;
	const enabled = useLessonMotion();
	const stages = [
		l("Original", "原记录"),
		l("Review proposal", "检查建议"),
		l("Record decision", "记录决定"),
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Preserved original and revision history",
						"保留原记录与修订历史",
					)}
					height={520}
				>
					<line
						x1={70}
						x2={290}
						y1={39}
						y2={39}
						stroke="currentColor"
						opacity={0.3}
					/>
					<m.circle
						cx={70 + replay.frame * 110}
						cy={39}
						r={7}
						fill="var(--primary)"
						stroke="currentColor"
						initial={false}
						animate={{ cx: 70 + replay.frame * 110 }}
						transition={
							enabled && replay.playing ? lessonTransition : instantTransition
						}
					/>
					{stages.map((label, i) => (
						<foreignObject
							key={label}
							x={25 + i * 110}
							y={57}
							width={90}
							height={44}
						>
							<button
								type="button"
								className="h-full w-full rounded-lg border text-xs"
								aria-pressed={replay.frame === i}
								onClick={() => replay.select(i)}
							>
								{label}
							</button>
						</foreignObject>
					))}
					<foreignObject x={25} y={126} width={310} height={135}>
						<div className="h-full rounded-xl border p-4 text-sm leading-relaxed">
							<strong>{l("Q1 · original retained", "Q1 · 原件保留")}</strong>
							<p>{data.original.claim[language]}</p>
						</div>
					</foreignObject>
					<SvgText x={180} y={295}>
						{replay.frame > 0
							? l("Review identity and evidence", "检查问题身份与证据")
							: l("Select or replay a revision", "选择或回放修订")}
					</SvgText>
					{replay.frame === 2 ? (
						<foreignObject x={25} y={326} width={310} height={153}>
							<div className="h-full rounded-xl border bg-primary/10 p-4 text-sm leading-relaxed">
								<strong>
									{fork
										? l("Q2 · new question draft", "Q2 · 新问题草案")
										: l("Q1 · revision 2", "Q1 · 修订 2")}
								</strong>
								<p>{revision.claim[language]}</p>
							</div>
						</foreignObject>
					) : (
						<SvgText x={180} y={380} muted>
							{l("No revised conclusion yet", "尚无修订结论")}
						</SvgText>
					)}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Revision proposal", "修订建议")}
				value={id}
				options={data.revisions.map((r) => [r.id, r.label[language]])}
				onChange={(value) => {
					setId(value);
					replay.select(0);
				}}
			/>
			<PlaybackButton playing={replay.playing} onClick={replay.toggle} l={l} />
			<p>{revision.evidence[language]}</p>
			<p className="font-mono text-xs">
				{data.original.version} → {revision.sourceVersion}
				<br />
				{revision.identity.subject} · {revision.identity.population}
				<br />
				{revision.identity.quantity}
				<br />
				{revision.identity.interval}
			</p>
			<p data-boundary-decision>
				{replay.frame < 2
					? l("Decision pending in this walkthrough", "此演示中的决定待记录")
					: fork
						? l("New question; retain Q1", "新问题；保留 Q1")
						: l(
								"Same question; retain Q1 and revise its evidence",
								"同一问题；保留 Q1 并修订证据",
							)}
			</p>
			{replay.frame === 2 && (
				<Note>
					{fork
						? l(
								"Changing the population or quantity/method changes the question. A newly interesting result does not authorize rewriting the original contract. Record the new design separately before interpreting it.",
								"更换人群或测量量/方法会改变问题。新出现的突出结果不允许重写原规则。解读前先单独记录新设计。",
							)
						: l(
								"Corrected observations or withdrawn coverage test the original question. Recompute or withhold the conclusion as required, while preserving the prior source version and claim. A changed answer does not by itself mean a changed question.",
								"更正观测或撤回覆盖检验原问题。按需重算或不发布结论，同时保留先前来源版本与结论。答案改变本身不意味着问题改变。",
							)}
				</Note>
			)}
			<p className="text-muted-foreground text-xs">
				{l(
					"This is a fixed local walkthrough, not a saved research ledger. One person can maintain the real note and its history. Changing the question may be legitimate; doing so silently after seeing results is the problem.",
					"这是固定本地演示，不是已保存研究账本。个人可维护真实笔记及历史。改变问题可以合理；看到结果后悄然改变才是问题。",
				)}
			</p>
		</SceneLayout>
	);
}
