import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import {
	FieldContent,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from "@tradely/ui/components/field";
import { RadioGroup, RadioGroupItem } from "@tradely/ui/components/radio-group";
import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Lesson } from "@/content/course";
import { type CoursePathId, courseModules } from "@/content/syllabus";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";

type Copy = readonly [en: string, zh: string];
type Question = {
	id: string;
	prompt: Copy;
	choices: readonly (readonly [id: string, en: string, zh: string])[];
	answer: string;
};
type Section = { lessonId: string; topic: Copy; questions: Question[] };

const PLACEMENT_HASH = "#placement";

/** In course order. The first section with a wrong answer is where to start. */
const sections: readonly Section[] = [
	{
		lessonId: "stocks-and-prices",
		topic: [
			"shares, quotes and what an option is",
			"股票、报价与期权的基本概念",
		],
		questions: [
			{
				id: "quote",
				prompt: [
					"A stock is quoted $40.00 bid and $40.05 ask. If you buy right away, what do you pay per share?",
					"某股票报价为买价 $40.00、卖价 $40.05。若立即买入，每股付多少？",
				],
				choices: [
					["bid", "$40.00", "$40.00"],
					["ask", "$40.05", "$40.05"],
					["mid", "$40.025", "$40.025"],
				],
				answer: "ask",
			},
			{
				id: "call",
				prompt: [
					"What does buying a call option give you?",
					"买入看涨期权让你获得什么？",
				],
				choices: [
					[
						"right",
						"The right, but not the obligation, to buy 100 shares at the strike before it expires",
						"在到期前按行权价买入 100 股的权利，而非义务",
					],
					[
						"obligation",
						"An obligation to buy 100 shares at the strike",
						"按行权价买入 100 股的义务",
					],
					[
						"share",
						"Shares of the company at a discount",
						"以折扣价买到的公司股票",
					],
				],
				answer: "right",
			},
		],
	},
	{
		lessonId: "option-contracts",
		topic: ["contract size and payoff", "合约乘数与到期盈亏"],
		questions: [
			{
				id: "multiplier",
				prompt: [
					"An option is quoted at $2.50. What does one standard contract cost, before fees?",
					"某期权报价 $2.50。一张标准合约要花多少钱（不含费用）？",
				],
				choices: [
					["2.5", "$2.50", "$2.50"],
					["25", "$25", "$25"],
					["250", "$250", "$250"],
				],
				answer: "250",
			},
			{
				id: "profit",
				prompt: [
					"You paid $3.00 for a call with a $100 strike. At expiry the stock is $104. What is your profit per share, before fees?",
					"你以 $3.00 买入行权价 $100 的看涨期权。到期时股价为 $104。每股盈利多少（不含费用）？",
				],
				choices: [
					["one", "$1.00", "$1.00"],
					["four", "$4.00", "$4.00"],
					["loss", "−$3.00", "−$3.00"],
				],
				answer: "one",
			},
		],
	},
	{
		lessonId: "quotes-orders-trades",
		topic: ["quotes versus trades", "报价与成交的区别"],
		questions: [
			{
				id: "fill",
				prompt: [
					"A contract shows bid $1.20 for 50 and ask $1.30 for 40. Has anyone traded at $1.30?",
					"某合约显示买价 $1.20（50 张）、卖价 $1.30（40 张）。是否有人以 $1.30 成交了？",
				],
				choices: [
					[
						"traded",
						"Yes, 40 contracts traded at $1.30",
						"是的，40 张以 $1.30 成交",
					],
					[
						"unknown",
						"Not necessarily: a quote is an offer, not a trade",
						"不一定：报价只是报出的价格，不是成交",
					],
					["mid", "Yes, at the $1.25 midpoint", "是的，以中间价 $1.25 成交"],
				],
				answer: "unknown",
			},
		],
	},
	{
		lessonId: "session-flow-vs-structure",
		topic: ["volume and open interest", "成交量与未平仓量"],
		questions: [
			{
				id: "open-interest",
				prompt: [
					"10,000 contracts of one option traded today. What happened to its open interest?",
					"某期权今天成交了 10,000 张。它的未平仓量发生了什么变化？",
				],
				choices: [
					["rose", "It rose by 10,000", "增加了 10,000 张"],
					[
						"half",
						"It rose by 5,000, one per buyer",
						"增加了 5,000 张，按买方计",
					],
					[
						"unknown",
						"Volume alone can't tell you: trades can open, close or transfer positions",
						"仅凭成交量无法判断：成交可能是开仓、平仓或转移持仓",
					],
				],
				answer: "unknown",
			},
		],
	},
	{
		lessonId: "audited-boundary",
		topic: ["framing a research question", "提出可研究的问题"],
		questions: [
			{
				id: "question",
				prompt: [
					"Which question can market data answer?",
					"哪个问题可以用市场数据回答？",
				],
				choices: [
					["rise", "Will ALFA rise next week?", "ALFA 下周会上涨吗？"],
					[
						"measure",
						"Was ALFA's call volume today above its 20-day average?",
						"ALFA 今天的看涨成交量是否高于其 20 日均值？",
					],
					[
						"know",
						"What do the traders buying ALFA calls know?",
						"买入 ALFA 看涨的交易者知道什么？",
					],
				],
				answer: "measure",
			},
		],
	},
	{
		lessonId: "delta",
		topic: ["delta", "Delta"],
		questions: [
			{
				id: "delta",
				prompt: [
					"A call has a delta of 0.40. If the stock rises $1 and nothing else changes, about how much does the call's price change?",
					"某看涨期权的 Delta 为 0.40。若股价上涨 $1 且其他条件不变，期权价格大约变化多少？",
				],
				choices: [
					["share", "About +$0.40 per share", "每股约 +$0.40"],
					["contract", "About +$0.40 per contract", "每张合约约 +$0.40"],
					["dollar", "About +$1.00 per share", "每股约 +$1.00"],
				],
				answer: "share",
			},
		],
	},
];
const questions = sections.flatMap((section) => section.questions);

/** Client-only self-placement. Nothing is saved or sent; any lesson stays open. */
export function PlacementCheck() {
	const { locale } = useI18n();
	const id = useId();
	const l = (copy: Copy) => (locale === "zh" ? copy[1] : copy[0]);
	const lessons = getLocalizedCourse(locale).lessons;
	const [expanded, setExpanded] = useState(false);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	useEffect(() => {
		const reveal = () => {
			if (window.location.hash !== PLACEMENT_HASH) return;
			setExpanded(true);
			document.getElementById("placement")?.scrollIntoView();
		};
		reveal();
		window.addEventListener("hashchange", reveal);
		return () => window.removeEventListener("hashchange", reveal);
	}, []);
	const answered = questions.every((question) => answers[question.id]);
	const correct = (question: Question) =>
		answers[question.id] === question.answer;
	const missed = sections.find((section) => !section.questions.every(correct));
	const lessonById = (lessonId: string) =>
		lessons.find((lesson) => lesson.id === lessonId);
	const pathLessons = (path: CoursePathId | "production") =>
		lessons.filter((lesson) => {
			const module = courseModules.find((item) => item.id === lesson.moduleId);
			return path === "production"
				? module?.id === "production"
				: module?.path === path;
		});
	const number = (lesson: Lesson) => lesson.order + 1;
	const lessonLink = (lesson: Lesson, primary: boolean) => (
		<Link
			to="/learn/$lessonSlug"
			params={{ lessonSlug: lesson.slug }}
			className={buttonVariants({
				variant: primary ? "default" : "outline",
				className: "h-auto min-h-10 max-w-full whitespace-normal text-left",
			})}
		>
			{locale === "zh"
				? `第 ${number(lesson)} 课：${lesson.title}`
				: `Lesson ${number(lesson)}: ${lesson.title}`}
			<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
		</Link>
	);
	const recommended = missed ? lessonById(missed.lessonId) : undefined;
	const branches = (["models", "portfolio"] as const).flatMap((path) => {
		const lesson = pathLessons(path)[0];
		return lesson ? [lesson] : [];
	});
	const output = pathLessons("production");
	return (
		<section id="placement" className="scroll-mt-24">
			<DisclosurePanel
				className="lesson-notes lesson-check"
				headingLevel={2}
				isExpanded={expanded}
				onExpandedChange={setExpanded}
				summary={
					<span className="flex flex-col gap-0.5">
						<span>
							{locale === "zh"
								? "不确定从哪里开始？"
								: "Not sure where to start?"}
						</span>
						<span className="font-normal text-muted-foreground text-xs">
							{locale === "zh"
								? `可选 · ${questions.length} 个小问题，不会保存任何内容`
								: `Optional · ${questions.length} quick questions, nothing is saved`}
						</span>
					</span>
				}
			>
				<form
					className="flex flex-col gap-6 pt-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (answered) setSubmitted(true);
					}}
				>
					<p className="text-muted-foreground text-sm">
						{locale === "zh"
							? "按课程顺序回答。第一个答错的问题所在的位置，就是建议你开始的地方。这只是建议，任何课程都可以随时打开。"
							: "The questions follow the course order. Where you first miss one is where we suggest you start. It is only a suggestion: every lesson stays open."}
					</p>
					<FieldGroup>
						{questions.map((question, index) => {
							const legendId = `${id}-${question.id}`;
							const answer = question.choices.find(
								([choice]) => choice === question.answer,
							);
							return (
								<FieldSet key={question.id}>
									<FieldLegend id={legendId}>
										{index + 1}. {l(question.prompt)}
									</FieldLegend>
									<RadioGroup
										aria-labelledby={legendId}
										value={answers[question.id] ?? ""}
										onValueChange={(value) => {
											if (typeof value !== "string") return;
											setAnswers((current) => ({
												...current,
												[question.id]: value,
											}));
											setSubmitted(false);
										}}
									>
										{question.choices.map(([choice, en, zh]) => (
											<RadioGroupItem
												key={choice}
												id={`${legendId}-${choice}`}
												value={choice}
											>
												<FieldContent>{locale === "zh" ? zh : en}</FieldContent>
											</RadioGroupItem>
										))}
									</RadioGroup>
									{submitted && answer ? (
										correct(question) ? (
											<p className="flex items-center gap-2 text-sm">
												<CheckIcon className="size-4" aria-hidden="true" />
												{locale === "zh" ? "正确" : "Correct"}
											</p>
										) : (
											<p className="flex items-center gap-2 text-muted-foreground text-sm">
												<XIcon className="size-4" aria-hidden="true" />
												{locale === "zh"
													? `答案：${answer[2]}`
													: `Answer: ${answer[1]}`}
											</p>
										)
									) : null}
								</FieldSet>
							);
						})}
					</FieldGroup>
					<div className="flex flex-wrap items-center gap-3">
						<Button type="submit" disabled={!answered}>
							{locale === "zh" ? "看看从哪里开始" : "See where to start"}
						</Button>
						{answered ? null : (
							<span className="text-muted-foreground text-sm">
								{locale === "zh"
									? `已回答 ${Object.keys(answers).length} / ${questions.length}`
									: `${Object.keys(answers).length} of ${questions.length} answered`}
							</span>
						)}
					</div>
				</form>
				{submitted ? (
					<div
						role="status"
						className="mt-6 flex flex-col gap-3 rounded-3xl bg-muted/50 p-4 sm:p-6"
					>
						{missed && recommended ? (
							<>
								<h3 className="font-semibold text-lg">
									{locale === "zh"
										? `建议从第 ${number(recommended)} 课开始`
										: `Start with lesson ${number(recommended)}`}
								</h3>
								<p className="text-muted-foreground text-sm">
									{recommended.order === 0
										? locale === "zh"
											? `你在“${l(missed.topic)}”上答错了题。建议从头开始，这些课程不需要任何基础。`
											: `You missed a question on ${l(missed.topic)}. Start from the beginning: these lessons assume no experience.`
										: locale === "zh"
											? `你在“${l(missed.topic)}”上答错了题，这一课正是从这里讲起。前面的课程可以跳过，需要时再回看。`
											: `You missed a question on ${l(missed.topic)}, which this lesson starts from. You can skip the lessons before it and come back whenever you need them.`}
								</p>
								<div>{lessonLink(recommended, true)}</div>
							</>
						) : (
							<>
								<h3 className="font-semibold text-lg">
									{locale === "zh"
										? "核心概念你都掌握了，选一个深入分支"
										: "You know the core ideas. Pick a deeper branch"}
								</h3>
								<p className="text-muted-foreground text-sm">
									{locale === "zh"
										? `两个分支可以按任意顺序学习。${output.length ? `如果你打算自己撰写研究，先看第 ${number(output[0])}–${number(output[output.length - 1])} 课：研究包、市场回顾与审计。` : ""}`
										: `The branches work in either order.${output.length ? ` If you plan to write up your own research, lessons ${number(output[0])}–${number(output[output.length - 1])} on research packets, recaps and audits come first.` : ""}`}
								</p>
								<div className="flex flex-wrap gap-3">
									{branches.map((lesson, index) => (
										<div key={lesson.id}>{lessonLink(lesson, index === 0)}</div>
									))}
								</div>
							</>
						)}
					</div>
				) : null}
			</DisclosurePanel>
		</section>
	);
}
