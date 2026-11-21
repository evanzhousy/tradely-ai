import type { Locale } from "@/i18n/messages";

/** The public setup page for Tradely's MCP connector (src/server/mcp.server.ts). */
export const CONNECTOR_URL = "https://www.tradely.ai/mcp";
export const SUPPORT_EMAIL = "support@tradely.ai";

export type ConnectorSection = {
	heading: string;
	paragraphs?: string[];
	bullets?: string[];
	/** A command or address shown as code, to copy. */
	code?: string;
	link?: { href: string; label: string };
};

export type ConnectorPage = {
	eyebrow: string;
	title: string;
	intro: string;
	addressLabel: string;
	sections: ConnectorSection[];
};

const pages: Record<Locale, ConnectorPage> = {
	en: {
		eyebrow: "AI assistants",
		title: "Tradely in Claude and ChatGPT",
		intro:
			"Tradely's connector lets Claude, ChatGPT and other assistants that support MCP play Tradely's free options lessons in the conversation: a short animated film with worked numbers, then a practice task. It is read-only and needs no account.",
		addressLabel: "Connector address",
		sections: [
			{
				heading: "Add it to Claude",
				paragraphs: [
					"In Claude on the web or the desktop app, open Settings, then Connectors. If Tradely is in the directory, choose it and connect. Otherwise choose Add custom connector, name it Tradely and enter the address below. There is nothing to sign in to. Custom connectors depend on your Claude plan.",
					"Turn Tradely on for a chat from the tools menu, then ask about an options concept.",
				],
				code: CONNECTOR_URL,
			},
			{
				heading: "Add it to ChatGPT or Claude Code",
				paragraphs: [
					"In ChatGPT, turn on developer mode in the Apps settings, then create a connector with the address above and no authentication.",
					"In Claude Code, add it from the terminal. Coding tools show the lesson's title, summary and link instead of the film.",
				],
				code: `claude mcp add --transport http tradely ${CONNECTOR_URL}`,
			},
			{
				heading: "Lessons it can play",
				bullets: [
					"Options: what a call and a put give you, and what the premium pays for",
					"Premium, payoff and profit, for the buyer and the writer",
					"Delta: how an option's price moves with the stock",
					"Gamma exposure (GEX): building a snapshot from stated assumptions",
					"Implied and realized volatility: forward and backward views",
				],
				paragraphs: [
					"For every other lesson in the course, the assistant gets its title, a one-line summary and its link on tradely.ai.",
				],
			},
			{
				heading: "Tools",
				bullets: [
					"list_lessons (read-only): every lesson in the course, in order, with its summary and link, in English or Chinese.",
					"show_lesson (read-only): plays one of the five lessons above in the conversation. Assistants that can't show it get the lesson's title, summary and link.",
				],
			},
			{
				heading: "Things to ask",
				bullets: [
					"Explain calls vs puts with the Tradely lesson.",
					"Show me how premium, payoff and profit work.",
					"What is delta? Show me the lesson.",
					"Teach me gamma exposure (GEX).",
					"What's the difference between implied and realized volatility?",
				],
			},
			{
				heading: "Privacy and limits",
				paragraphs: [
					"The connector receives only the lesson or list asked for and, if the assistant gives one, a language. It receives no account, name or conversation, and the lesson records no analytics. Lessons are educational, not investment advice.",
				],
				link: { href: "/privacy", label: "Read the privacy policy" },
			},
			{
				heading: "Support",
				paragraphs: [
					`Questions or problems with the connector: ${SUPPORT_EMAIL}.`,
				],
			},
		],
	},
	zh: {
		eyebrow: "AI 助手",
		title: "在 Claude 和 ChatGPT 中使用 Tradely",
		intro:
			"通过 Tradely 连接器，Claude、ChatGPT 以及其他支持 MCP 的助手可以在对话中播放 Tradely 的免费期权课程：先看一段带有实际数字推演的短动画，再做一道练习。连接器只读，无需账户。",
		addressLabel: "连接器地址",
		sections: [
			{
				heading: "添加到 Claude",
				paragraphs: [
					"在 Claude 网页版或桌面应用中打开“设置”，再进入“连接器”。如果目录中已有 Tradely，选择它并连接；否则选择“添加自定义连接器”，命名为 Tradely 并填入下方地址。无需登录。能否添加自定义连接器取决于你的 Claude 套餐。",
					"在对话的工具菜单中打开 Tradely，然后提问期权概念即可。",
				],
				code: CONNECTOR_URL,
			},
			{
				heading: "添加到 ChatGPT 或 Claude Code",
				paragraphs: [
					"在 ChatGPT 中，于 Apps 设置里开启开发者模式，然后用上方地址创建连接器，认证方式选择“无”。",
					"在 Claude Code 中，可在终端添加。编程工具会显示课程标题、简介和链接，而不是动画。",
				],
				code: `claude mcp add --transport http tradely ${CONNECTOR_URL}`,
			},
			{
				heading: "可播放的课程",
				bullets: [
					"期权：看涨与看跌赋予的权利，以及权利金买到了什么",
					"权利金、到期价值与盈亏：买方与卖方两边",
					"Delta：期权价格如何随股价变动",
					"Gamma 敞口（GEX）：在明确假设下建立快照",
					"隐含波动率与已实现波动率：向前看与向后看",
				],
				paragraphs: [
					"对于课程中的其他课，助手会获得课程标题、一句话简介和 tradely.ai 上的链接。",
				],
			},
			{
				heading: "工具",
				bullets: [
					"list_lessons（只读）：按顺序列出全部课程及其简介和链接，可选英文或中文。",
					"show_lesson（只读）：在对话中播放上面五节课之一；无法显示的助手会收到课程标题、简介和链接。",
				],
			},
			{
				heading: "可以这样问",
				bullets: [
					"用 Tradely 的课程讲讲看涨期权和看跌期权的区别。",
					"给我看看权利金、到期价值和盈亏是怎么回事。",
					"Delta 是什么？给我看这节课。",
					"教我 Gamma 敞口（GEX）。",
					"隐含波动率和已实现波动率有什么不同？",
				],
			},
			{
				heading: "隐私与限制",
				paragraphs: [
					"连接器只收到请求的课程或列表，以及助手提供的语言（如有）；不会收到账户、姓名或对话内容，课程也不记录分析数据。课程仅供学习，不构成投资建议。",
				],
				link: { href: "/privacy", label: "阅读隐私政策" },
			},
			{
				heading: "支持",
				paragraphs: [`连接器相关问题请发送邮件至 ${SUPPORT_EMAIL}。`],
			},
		],
	},
};

export const getConnectorPage = (locale: Locale) => pages[locale];
