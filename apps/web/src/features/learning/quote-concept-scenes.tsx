import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import {
	type BookEvent,
	bestQuotes,
	bookOutcome,
	quoteMoney as money,
	quoteMeasures,
} from "@/domain/learning/quote-concept";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
	Diagram,
	PlaybackButton,
	RangeControl,
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
import { useQuoteData } from "./quote-concept-data";

type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
function Snapshot({ locale }: Props) {
	const data = useQuoteData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.contract}
			<br />
			{data.asOf}
			<br />
			{l(
				"Fictional snapshot · USD/share · sizes in contracts",
				"虚构快照 · 美元/股 · 数量单位：张",
			)}
		</p>
	);
}
function Note({ children }: { children: ReactNode }) {
	return (
		<p className="rounded-xl border bg-muted/40 p-3 text-sm leading-relaxed">
			{children}
		</p>
	);
}
export function QuoteAnatomyScene({ locale }: Props) {
	const data = useQuoteData();
	const l = text(locale);
	const [ask, setAsk] = useState(data.ask);
	const [mark, setMark] = useState("midpoint");
	const { spread, midpoint } = quoteMeasures(data.bid, ask);
	const x = (price: number) =>
		40 + ((price - data.bid) / (data.askRange[1] - data.bid)) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Live quote geometry with an unchanged dated last trade",
						"报价变化与保持不变的带时间成交价",
					)}
					height={365}
				>
					<rect
						x="14"
						y="18"
						width="150"
						height="93"
						rx="12"
						className="contract-svg-paper"
					/>
					<rect
						x="196"
						y="18"
						width="150"
						height="93"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={89} y={43} muted>
						{l("BID · buy", "买价 · 愿意买入")}
					</SvgText>
					<SvgText x={89} y={73} strong>
						{money(data.bid)}
					</SvgText>
					<SvgText x={89} y={97} muted>
						× {data.bidSize} {l("contracts", "张")}
					</SvgText>
					<SvgText x={271} y={43} muted>
						{l("ASK · sell", "卖价 · 愿意卖出")}
					</SvgText>
					<SvgText x={271} y={73} strong>
						{money(ask)}
					</SvgText>
					<SvgText x={271} y={97} muted>
						× {data.askSize} {l("contracts", "张")}
					</SvgText>
					<path d="M40 171H320" className="contract-svg-line" />
					<path d={`M40 171H${x(ask)}`} className="contract-svg-active-line" />
					<circle cx="40" cy="171" r="6" className="contract-svg-dot" />
					<circle
						cx={x(midpoint)}
						cy="171"
						r="6"
						className="contract-svg-dot"
					/>
					<circle cx={x(ask)} cy="171" r="10" className="contract-svg-handle" />
					<SvgText x={180} y={144} muted>
						{l("Ask moves → spread changes", "卖价移动 → 价差改变")}
					</SvgText>
					<SvgText x={95} y={214} muted>
						{l("Spread", "价差")}
					</SvgText>
					<SvgText x={265} y={214} muted>
						{l("Midpoint", "中点")}
					</SvgText>
					<g data-quote-spread>
						<SvgText x={95} y={243} strong>
							{money(spread)}
						</SvgText>
					</g>
					<g data-quote-midpoint>
						<SvgText x={265} y={243} strong>
							{money(midpoint)}
						</SvgText>
					</g>
					<rect
						x="14"
						y="270"
						width="332"
						height="76"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={297}>
						{l("Last execution", "最新成交")} · {money(data.last.price)}
					</SvgText>
					<SvgText x={180} y={324} muted>
						{data.last.at} · {l("unchanged", "保持不变")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<RangeControl
				label={l("What-if ask price", "假设卖价")}
				value={ask}
				display={money(ask)}
				min={data.askRange[0]}
				max={data.askRange[1]}
				onChange={setAsk}
			/>
			<SelectField
				label={l("Mark convention", "估值约定")}
				value={mark}
				options={[
					["midpoint", l("Use midpoint", "使用中点")],
					["last", l("Use last execution", "使用最新成交")],
				]}
				onChange={setMark}
			/>
			<p className="text-sm" data-quote-mark>
				{l("Illustrative mark", "示例估值价")}:{" "}
				<strong>
					{money(mark === "midpoint" ? midpoint : data.last.price)}
				</strong>
			</p>
			<Note>
				{l(
					"Spread = ask − bid. Midpoint = (bid + ask) ÷ 2. A midpoint or mark is a reference, not proof of an execution or an available fill price. Moving this quote creates no trades.",
					"价差 = 卖价 − 买价；中点 =（买价 + 卖价）÷ 2。中点或估值价是参考值，不证明发生过成交，也不保证可以成交。移动报价不会产生交易。",
				)}
			</Note>
		</SceneLayout>
	);
}
export function BookEventScene({ locale }: Props) {
	const data = useQuoteData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [event, setEvent] = useState<BookEvent>("cancel");
	const [size, setSize] = useState(data.eventLimit);
	const playback = useFrames(3);
	const result = bookOutcome(data, event, size, playback.frame === 2);
	const stages = [
		l("Initial quote", "初始报价"),
		l("Instruction sent", "指令已发送"),
		l("Outcome confirmed", "结果已确认"),
	];
	const names = {
		add: l("Add sell limit", "新增限价卖单"),
		cancel: l("Cancel sell order", "取消卖单"),
		trade: l("Buy order", "买入订单"),
	};
	const changed = playback.frame === 2;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Order instructions, displayed ask size and the execution tape",
						"订单指令、可见卖量与成交记录",
					)}
					height={430}
				>
					<SvgText x={180} y={27} muted>
						{stages[playback.frame]}
					</SvgText>
					<rect
						x="35"
						y="47"
						width="290"
						height="65"
						rx="12"
						className={
							playback.frame > 0 ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={180} y={75} strong>
						{names[event]} · {size}
					</SvgText>
					<SvgText x={180} y={98} muted>
						{l("At the ask", "位于卖价")} {money(data.ask)}
					</SvgText>
					<path
						d="M180 112v29H90v26M180 141h90v26"
						className="contract-svg-line"
					/>
					{changed ? (
						<m.path
							key={event}
							d={
								event === "trade"
									? "M180 112v29H90v26M180 141h90v26"
									: "M180 112v29H90v26"
							}
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.45 }
									: instantTransition
							}
						/>
					) : null}
					<rect
						x="14"
						y="167"
						width="152"
						height="141"
						rx="12"
						className="contract-svg-paper"
					/>
					<rect
						x="194"
						y="167"
						width="152"
						height="141"
						rx="12"
						className={
							result.prints ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={90} y={191} muted>
						{l("Displayed ask", "可见卖量")}
					</SvgText>
					<g data-book-ask>
						<SvgText x={90} y={224} strong>
							{result.askSize} {l("contracts", "张")}
						</SvgText>
					</g>
					<rect
						x="29"
						y="241"
						width="122"
						height="10"
						rx="5"
						className="contract-svg-wash"
					/>
					<m.rect
						initial={false}
						width={(122 * result.askSize) / (data.askSize + data.eventLimit)}
						x="29"
						y="241"
						height="10"
						rx="5"
						className="contract-svg-dot"
						animate={{
							width: (122 * result.askSize) / (data.askSize + data.eventLimit),
						}}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={90} y={281} muted>
						{money(data.ask)} / {l("share", "股")}
					</SvgText>
					<SvgText x={270} y={191} muted>
						{l("New traded volume", "新增成交量")}
					</SvgText>
					<g data-book-volume>
						<SvgText x={270} y={224} strong>
							{result.volume} {l("contracts", "张")}
						</SvgText>
					</g>
					<SvgText x={270} y={251} muted>
						{result.prints} {l("trade messages", "条成交消息")}
					</SvgText>
					<SvgText x={270} y={281} muted>
						{l("This interval only", "仅本演示区间")}
					</SvgText>
					<rect
						x="14"
						y="327"
						width="332"
						height="84"
						rx="12"
						className="contract-svg-paper"
					/>
					<g data-book-last>
						<SvgText x={180} y={354}>
							{l("Last", "最新成交价")} {money(result.last.price)}
						</SvgText>
						<SvgText x={180} y={379} muted>
							{result.last.at}
						</SvgText>
					</g>
					<SvgText x={180} y={401} muted>
						{l("Bid stays", "买价保持")} {money(data.bid)} × {data.bidSize}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<ChoiceField
				label={l("Compare events", "比较事件")}
				value={event}
				options={[
					["add", l("Add", "新增")],
					["cancel", l("Cancel", "撤单")],
					["trade", l("Trade", "成交")],
				]}
				onChange={(value) => {
					playback.select(playback.frame);
					setEvent(value);
				}}
			/>
			<RangeControl
				label={l("Order quantity", "订单数量")}
				value={size}
				display={`${size} ${l("contracts", "张")}`}
				min={1}
				max={data.eventLimit}
				onChange={(value) => {
					playback.select(playback.frame);
					setSize(value);
				}}
			/>
			<SelectField
				label={l("Event stage", "事件阶段")}
				value={String(playback.frame)}
				options={stages.map((label, i) => [String(i), label])}
				onChange={(value) => playback.select(Number(value))}
			/>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Note>
				{!changed
					? l(
							"An instruction is not a confirmed result. The book and tape stay unchanged until the supplied outcome arrives.",
							"指令不等于已确认结果。给定结果到达之前，订单簿与成交记录保持不变。",
						)
					: event === "trade"
						? l(
								"This example supplies a confirmed match at the ask. Volume and last now update. Sending a buy order alone would not establish that fill.",
								"此例给定了在卖价的已确认撮合，成交量与最新成交价随之更新。仅发送买单不能证明成交。",
							)
						: l(
								"The quote size changes, but no trade is reported. A cancellation removes an unfilled order; it does not add traded volume.",
								"报价数量改变，但没有成交报告。撤单移除未成交订单，不增加成交量。",
							)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Isolated displayed-book example: no other orders, hidden liquidity or executions. Times share the snapshot date.",
					"独立可见订单簿示例：没有其他订单、隐藏流动性或成交。所有时间均属快照当日。",
				)}
			</p>
		</SceneLayout>
	);
}
export function VenueQuoteScene({ locale }: Props) {
	const data = useQuoteData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [selected, setSelected] = useState(data.venues[0]?.id ?? "");
	const [scope, setScope] = useState("all");
	const eligible = data.venues.filter(
		(v) => scope === "all" || (scope === "stale" && v.id !== data.staleVenue),
	);
	const best = bestQuotes(eligible);
	const inspected = data.venues.find((v) => v.id === selected);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Eligible venue quotes feed the combined best bid and ask",
						"合格场所报价形成汇总最优买卖价",
					)}
					height={430}
				>
					<SvgText x={55} y={24} muted>
						{l("Venue", "场所")}
					</SvgText>
					<SvgText x={163} y={24} muted>
						{l("Bid × size", "买价 × 数量")}
					</SvgText>
					<SvgText x={277} y={24} muted>
						{l("Ask × size", "卖价 × 数量")}
					</SvgText>
					{data.venues.map((venue, i) => {
						const y = 40 + i * 77;
						const included = eligible.includes(venue);
						return (
							<g key={venue.id}>
								<rect
									x="24"
									y={y}
									width="312"
									height="64"
									rx="10"
									className={
										selected === venue.id
											? "contract-svg-wash"
											: "contract-svg-paper"
									}
								/>
								<SvgText x={55} y={y + 26} strong>
									{venue.id}
								</SvgText>
								<SvgText x={163} y={y + 26}>
									{money(venue.bid)} × {venue.bidSize}
								</SvgText>
								<SvgText x={277} y={y + 26}>
									{money(venue.ask)} × {venue.askSize}
								</SvgText>
								<SvgText x={180} y={y + 50} muted>
									{scope === "stale" && venue.id === data.staleVenue
										? data.staleAt
										: data.quoteAt}{" "}
									· {included ? l("eligible", "合格") : l("excluded", "已排除")}
								</SvgText>
								{best?.bidVenues.includes(venue.id) ? (
									<m.path
										key={`bid:${scope}`}
										d={`M24 ${y + 26}H12V319H95V336`}
										className="contract-svg-active-line"
										initial={{ pathLength: motion ? 0 : 1 }}
										animate={{ pathLength: 1 }}
										transition={
											motion
												? { ...lessonTransition, duration: 0.45 }
												: instantTransition
										}
									/>
								) : null}
								{best?.askVenues.includes(venue.id) ? (
									<m.path
										key={`ask:${scope}`}
										d={`M336 ${y + 26}H348V319H265V336`}
										className="contract-svg-active-line"
										initial={{ pathLength: motion ? 0 : 1 }}
										animate={{ pathLength: 1 }}
										transition={
											motion
												? { ...lessonTransition, duration: 0.45 }
												: instantTransition
										}
									/>
								) : null}
							</g>
						);
					})}
					<SvgText x={180} y={293} muted>
						{l("Best eligible prices", "合格报价中的最优价格")}
					</SvgText>
					<rect
						x="24"
						y="336"
						width="312"
						height="80"
						rx="12"
						className="contract-svg-wash"
					/>
					<g data-best-bid>
						<SvgText x={95} y={366} strong>
							{best ? money(best.bid) : "—"}
						</SvgText>
					</g>
					<g data-best-ask>
						<SvgText x={265} y={366} strong>
							{best ? money(best.ask) : "—"}
						</SvgText>
					</g>
					<SvgText x={95} y={391} muted>
						{best
							? `${l("Bid from", "买价来自")} ${best.bidVenues.join(" + ")}`
							: l("No eligible bid", "无合格买价")}
					</SvgText>
					<SvgText x={265} y={391} muted>
						{best
							? `${l("Ask from", "卖价来自")} ${best.askVenues.join(" + ")}`
							: l("No eligible ask", "无合格卖价")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<ChoiceField
				label={l("Inspect venue", "检查场所")}
				value={selected}
				options={data.venues.map((v) => [v.id, v.id])}
				onChange={setSelected}
			/>
			<p className="text-sm" data-venue-inspected>
				{l("Venue", "场所")} {selected}:{" "}
				{inspected ? `${money(inspected.bid)} / ${money(inspected.ask)}` : "—"}
				<br />
				{l("Its own spread", "自身价差")}:{" "}
				{inspected ? money(inspected.ask - inspected.bid) : "—"}
			</p>
			<SelectField
				label={l("Quote eligibility", "报价资格")}
				value={scope}
				options={[
					["all", l("All current", "全部有效")],
					[
						"stale",
						l(
							`Exclude stale venue ${data.staleVenue}`,
							`排除过期场所 ${data.staleVenue}`,
						),
					],
					["none", l("No eligible quotes", "没有合格报价")],
				]}
				onChange={setScope}
			/>
			<p className="text-sm" data-best-spread>
				{l("Combined spread", "汇总价差")}:{" "}
				<strong>{best ? money(best.spread) : l("Unknown", "未知")}</strong>
			</p>
			<Note>
				{l(
					"NBBO combines the best eligible quotations across venues. This three-venue teaching model illustrates that idea; it is not a live national feed or a fill guarantee. Excluded rows remain visible for comparison. Missing quotes do not mean a zero price.",
					"NBBO 汇总各场所的合格最优报价。三个虚构场所仅演示这一概念，并非实时全国行情，也不保证成交。排除的行仍保留供比较；缺失报价不等于价格为零。",
				)}
			</Note>
		</SceneLayout>
	);
}
