import type { Locale } from "@/i18n/messages";

export type LegalPageId = "privacy" | "terms" | "risk-disclosure" | "cookies";

export type LegalSection = {
	heading: string;
	paragraphs?: readonly string[];
	bullets?: readonly string[];
};

export type LegalDocument = {
	title: string;
	intro: string;
	lastUpdated: string;
	sections: readonly LegalSection[];
};

export const legalPageIds: readonly LegalPageId[] = [
	"privacy",
	"terms",
	"risk-disclosure",
	"cookies",
];

const documents: Record<Locale, Record<LegalPageId, LegalDocument>> = {
	en: {
		privacy: {
			title: "Privacy policy",
			intro:
				"This policy explains how Tradely collects, uses, and protects information when you use the Tradely learning hub at tradely.ai.",
			lastUpdated: "Last updated: August 28, 2026",
			sections: [
				{
					heading: "Information we collect",
					paragraphs: [
						"When you create or use a Tradely account, we receive the identity and contact details provided through Clerk, such as your name, email address, and account identifiers.",
						"We record learning activity needed to operate the hub, including lesson completion, video resume position, content version, and timestamps. If you allow analytics, we also receive limited page-usage, learning-milestone, browser-performance, and error-diagnostic information. PostHog may process the client IP for coarse location and bot detection, but the Tradely project discards it instead of storing it with events. Tradely strips URL query strings and does not send lesson text, payment details, or your email address to PostHog.",
					],
				},
				{
					heading: "Billing information",
					paragraphs: [
						"Tradely uses Stripe-hosted checkout and billing management. Stripe processes payment-card details and billing transactions; Tradely stores a Stripe customer reference and entitlement state needed to decide which lessons are available. Tradely does not receive or store your full card number.",
					],
				},
				{
					heading: "How we use information",
					bullets: [
						"Provide, secure, and troubleshoot the learning hub.",
						"Save your progress and restore video position across devices.",
						"Confirm membership access to protected course media.",
						"Process payments and provide billing support through Stripe.",
						"With your permission, understand page usage, service reliability, performance, errors, and curriculum usability.",
					],
				},
				{
					heading: "Service providers and partner boundary",
					paragraphs: [
						"Our service providers may include Clerk for identity, Stripe for billing, Neon for the Tradely database, Vercel for application delivery, Cloudflare R2 for media storage, and PostHog for consented product analytics and error diagnostics. They process information only as needed to provide their infrastructure and services.",
						"TradingFlow is an independent partnered product. Tradely does not share your Clerk account, billing record, learning record, or customer identifiers with TradingFlow. Links to TradingFlow are outbound practice links; any TradingFlow account or subscription is governed by TradingFlow's own terms and privacy practices.",
					],
				},
				{
					heading: "Retention, deletion, and security",
					paragraphs: [
						"We retain account and progress information while it is needed to provide the service, meet legal obligations, resolve disputes, and maintain security. You may request account deletion or correction through Tradely support. Some records may remain in backups or be retained where the law requires it.",
						"We use access controls, short-lived media URLs, encrypted transport, and provider security controls appropriate to the information involved. No online service can guarantee absolute security, so please protect your account credentials and contact us promptly about suspected misuse.",
					],
				},
				{
					heading: "Your choices and rights",
					paragraphs: [
						"Depending on where you live, you may have rights to access, correct, delete, restrict, or export personal information, and to object to certain processing. We will verify requests and respond as required by applicable law. You can manage account details in Clerk, billing details in Stripe's customer portal, and optional analytics through Privacy choices in the Tradely footer.",
					],
				},
				{
					heading: "Children and policy changes",
					paragraphs: [
						"Tradely is intended for adults and is not directed to children under 13. We may update this policy when the service or legal requirements change; the updated date above indicates when the latest version took effect.",
						"For questions or privacy requests, contact Tradely support through tradely.ai.",
					],
				},
			],
		},
		terms: {
			title: "Terms of service",
			intro:
				"These terms govern your use of the Tradely learning hub, its curriculum, and member features.",
			lastUpdated: "Last updated: August 28, 2026",
			sections: [
				{
					heading: "Educational service",
					paragraphs: [
						"Tradely provides educational material and structured practice prompts about options research. The service is for learning and workflow practice only. It is not investment, legal, tax, accounting, or financial advice, and it does not recommend a security, trade, strategy, or position.",
					],
				},
				{
					heading: "Accounts and access",
					paragraphs: [
						"Keep your account information accurate and protect the credentials used with Clerk. Your account is personal unless Tradely has expressly agreed otherwise. Do not share access, bypass lesson controls, scrape protected media, or use another person's billing or account information.",
					],
				},
				{
					heading: "Membership and billing",
					paragraphs: [
						"Paid lessons require an active Tradely membership as shown at checkout. Stripe processes payment and recurring billing details. Cancellation, renewals, refunds, and taxes are handled according to the checkout terms and applicable law; access may remain available through the paid period shown by Stripe.",
					],
				},
				{
					heading: "TradingFlow partnership",
					paragraphs: [
						"TradingFlow is a separate service operated by an independent partner. Tradely course links may open TradingFlow for practice, but TradingFlow accounts, pricing, availability, and data are outside these terms and governed by TradingFlow's own policies.",
					],
				},
				{
					heading: "Content and acceptable use",
					paragraphs: [
						"Tradely and its licensors retain rights in the curriculum, videos, written lessons, branding, and software. You may use them for personal learning during authorized access. Do not copy, resell, publicly redistribute, reverse engineer, or remove notices from the service.",
					],
				},
				{
					heading: "Availability and disclaimers",
					paragraphs: [
						"We work to keep Tradely available and accurate, but the service may change, be interrupted, or contain errors. Market data and linked services may be delayed or incomplete. We do not promise a particular trading, learning, or financial result. You are responsible for decisions made after using the material.",
					],
				},
				{
					heading: "Changes and contact",
					paragraphs: [
						"We may update these terms as the service evolves. Continued use after an update means you accept the revised terms. For questions, contact Tradely support through tradely.ai.",
					],
				},
			],
		},
		"risk-disclosure": {
			title: "Options risk disclosure",
			intro:
				"Options involve substantial risk and are not suitable for every investor. Read this disclosure before using Tradely's educational material or any linked practice tool.",
			lastUpdated: "Last updated: August 28, 2026",
			sections: [
				{
					heading: "You can lose the entire amount invested",
					paragraphs: [
						"An option can expire worthless. The premium, fees, and other amounts paid for a position may be lost in full. Some strategies can create losses substantially larger than the initial premium or require additional collateral.",
					],
				},
				{
					heading: "Leverage, assignment, and expiration",
					paragraphs: [
						"Leverage can magnify gains and losses. Short options may be assigned before expiration, and exercise or assignment can create stock or cash obligations. Expiration, settlement rules, liquidity, spreads, and early-closure constraints can materially change outcomes.",
					],
				},
				{
					heading: "Data and model limits",
					paragraphs: [
						"TradingFlow practice links and Tradely examples may use delayed, incomplete, or modeled information. Flow, Greeks, open interest, DEX, DEI, GEX, rankings, and recaps describe evidence or model outputs; they do not reveal another trader's intent or guarantee future prices.",
					],
				},
				{
					heading: "No recommendation",
					paragraphs: [
						"Nothing in Tradely is a recommendation to buy, sell, hold, exercise, or short any security or derivative. Assess your objectives, experience, liquidity, and risk capacity, and consult a qualified adviser when appropriate. You are solely responsible for your decisions and results.",
					],
				},
			],
		},
		cookies: {
			title: "Cookie policy",
			intro:
				"This policy describes the browser storage and cookies Tradely uses to keep the learning hub dependable and remember your choices.",
			lastUpdated: "Last updated: August 28, 2026",
			sections: [
				{
					heading: "Strictly necessary storage",
					paragraphs: [
						"Authentication and security cookies or browser storage support Clerk sessions, request protection, and access to member lessons. Without them, sign-in and protected media cannot work reliably.",
					],
				},
				{
					heading: "Preference storage",
					paragraphs: [
						"Tradely stores your theme and language preference in your browser so the interface opens in the mode you selected. These preferences are not used to identify you across unrelated sites.",
					],
				},
				{
					heading: "Optional measurement",
					paragraphs: [
						"Tradely initializes PostHog in an opted-out state. No analytics events are sent until you choose Allow analytics. After consent, PostHog may use browser storage and cookies to connect page usage, learning milestones, web-vitals measurements, and error diagnostics across a session. Tradely disables PostHog autocaptured element text, session replay, heatmaps, surveys, and console-log capture.",
						"PostHog analytics is used for product improvement and reliability, not advertising. Tradely identifies signed-in analytics only with the Clerk user ID and does not send the learner's email address, lesson text, or payment details.",
					],
				},
				{
					heading: "Your controls",
					paragraphs: [
						"Use Privacy choices in the Tradely footer to allow or withdraw optional analytics at any time. Withdrawing consent stops capture and resets the PostHog browser identity. You can also clear browser storage or block cookies through your browser settings. Blocking necessary storage may sign you out or prevent billing and protected lesson features from working.",
					],
				},
			],
		},
	},
	zh: {
		privacy: {
			title: "隐私政策",
			intro:
				"本政策说明你使用 tradely.ai 学习中心时，Tradely 如何收集、使用和保护信息。",
			lastUpdated: "最后更新：2026 年 8 月 28 日",
			sections: [
				{
					heading: "我们收集的信息",
					paragraphs: [
						"创建或使用 Tradely 账户时，我们会从 Clerk 接收你提交的身份和联系方式，例如姓名、邮箱地址和账户标识符。",
						"为提供学习中心功能，我们会记录课程完成状态、视频播放位置、内容版本和时间戳。如果你允许分析，我们还会接收有限的页面使用、学习里程碑、浏览器性能和错误诊断信息。PostHog 可能临时处理客户端 IP 用于粗略地区和机器人识别，但 Tradely 项目会丢弃该 IP，不把它与事件一起保存。Tradely 会移除 URL 查询参数，不会向 PostHog 发送课程正文、付款信息或邮箱地址。",
					],
				},
				{
					heading: "账单信息",
					paragraphs: [
						"Tradely 使用 Stripe 托管结账和账单管理。Stripe 处理银行卡信息和账单交易；Tradely 仅保存用于判断课程权限的 Stripe 客户引用和会员状态，不会接收或保存完整卡号。",
					],
				},
				{
					heading: "信息用途",
					bullets: [
						"提供、保护和排查学习中心。",
						"保存课程进度，并在不同设备恢复视频位置。",
						"确认受保护课程媒体的会员权限。",
						"通过 Stripe 处理付款并提供账单支持。",
						"经你允许，了解页面使用、服务可靠性、性能、错误和课程体验。",
					],
				},
				{
					heading: "服务供应商与合作边界",
					paragraphs: [
						"我们的服务供应商可能包括负责身份的 Clerk、负责账单的 Stripe、负责 Tradely 数据库的 Neon、负责应用交付的 Vercel、负责媒体存储的 Cloudflare R2，以及负责经同意的产品分析和错误诊断的 PostHog。他们仅在提供基础设施和服务所需范围内处理信息。",
						"TradingFlow 是独立运营的合作产品。Tradely 不会向 TradingFlow 分享你的 Clerk 账户、账单记录、学习记录或客户标识符。指向 TradingFlow 的链接只是练习入口；TradingFlow 账户和订阅适用其自己的条款与隐私政策。",
					],
				},
				{
					heading: "保存期限、删除与安全",
					paragraphs: [
						"我们会在提供服务、履行法律义务、处理争议和维护安全所需的期限内保存账户和进度信息。你可以通过 Tradely 支持请求删除或更正账户信息；法律要求或备份需要时，部分记录可能继续保留。",
						"我们使用访问控制、短期媒体地址、加密传输和供应商安全控制来保护信息。任何在线服务都无法保证绝对安全，请保护账户凭据并及时报告可疑使用。",
					],
				},
				{
					heading: "你的选择与权利",
					paragraphs: [
						"根据所在地法律，你可能拥有访问、更正、删除、限制处理或导出个人信息，以及反对某些处理的权利。我们会验证请求，并依适用法律回复。你可以在 Clerk 中管理账户信息，在 Stripe 客户门户管理账单信息，并通过 Tradely 页脚的隐私设置管理可选分析。",
					],
				},
				{
					heading: "儿童与政策变更",
					paragraphs: [
						"Tradely 面向成年人，不针对 13 岁以下儿童。服务或法律要求变化时，我们可能更新本政策；上方日期表示最新版本生效时间。隐私问题或请求可通过 tradely.ai 联系 Tradely 支持。",
					],
				},
			],
		},
		terms: {
			title: "服务条款",
			intro: "本条款约束你对 Tradely 学习中心、课程内容和会员功能的使用。",
			lastUpdated: "最后更新：2026 年 8 月 28 日",
			sections: [
				{
					heading: "教育服务",
					paragraphs: [
						"Tradely 提供关于期权研究的教育材料和结构化练习提示，仅用于学习和流程练习，不构成投资、法律、税务、会计或金融建议，也不推荐任何证券、交易、策略或仓位。",
					],
				},
				{
					heading: "账户与访问",
					paragraphs: [
						"请保持账户信息准确，并保护 Clerk 凭据。除非 Tradely 明确同意，账户仅限本人使用。不得分享访问权限、绕过课程控制、抓取受保护媒体，或使用他人的账单和账户信息。",
					],
				},
				{
					heading: "会员与账单",
					paragraphs: [
						"付费课程需要结账页面显示的有效 Tradely 会员。Stripe 处理付款和周期账单；取消、续费、退款和税费依结账条款及适用法律处理，访问权限可能持续到 Stripe 显示的付费周期结束。",
					],
				},
				{
					heading: "TradingFlow 合作关系",
					paragraphs: [
						"TradingFlow 是独立合作方运营的单独服务。Tradely 课程链接可能打开 TradingFlow 进行练习，但 TradingFlow 的账户、价格、可用性和数据不属于本条款，而适用 TradingFlow 自己的政策。",
					],
				},
				{
					heading: "内容与合理使用",
					paragraphs: [
						"Tradely 及其许可方拥有课程、视频、文字、品牌和软件的权利。你可以在获得授权期间用于个人学习，但不得复制、转售、公开传播、反向工程或移除服务中的权利声明。",
					],
				},
				{
					heading: "可用性与免责声明",
					paragraphs: [
						"我们会努力保持 Tradely 可用和准确，但服务可能变化、中断或包含错误。市场数据和链接服务可能延迟或不完整。我们不保证特定交易、学习或财务结果；使用材料后的决定由你自行负责。",
					],
				},
				{
					heading: "变更与联系",
					paragraphs: [
						"服务演进时我们可能更新本条款。更新后继续使用即表示接受修订条款。如有问题，请通过 tradely.ai 联系 Tradely 支持。",
					],
				},
			],
		},
		"risk-disclosure": {
			title: "期权风险披露",
			intro:
				"期权涉及重大风险，并不适合所有投资者。在使用 Tradely 教育材料或任何练习工具前，请阅读本披露。",
			lastUpdated: "最后更新：2026 年 8 月 28 日",
			sections: [
				{
					heading: "可能损失全部投入",
					paragraphs: [
						"期权可能到期归零。为仓位支付的权利金、费用和其他金额可能全部损失；某些策略的损失可能显著超过初始权利金，或需要额外保证金。",
					],
				},
				{
					heading: "杠杆、指派与到期",
					paragraphs: [
						"杠杆会放大盈亏。卖出期权可能在到期前被指派，行权或指派可能产生股票或现金义务。到期、结算规则、流动性、价差和提前平仓限制都会改变结果。",
					],
				},
				{
					heading: "数据和模型限制",
					paragraphs: [
						"TradingFlow 练习链接和 Tradely 示例可能使用延迟、不完整或模型化信息。成交流、Greeks、未平仓量、DEX、DEI、GEX、排名和 recap 描述证据或模型输出，不能揭示其他交易者的意图，也不能保证未来价格。",
					],
				},
				{
					heading: "不构成推荐",
					paragraphs: [
						"Tradely 的任何内容都不是买入、卖出、持有、行权或做空任何证券或衍生品的推荐。请评估目标、经验、流动性和风险承受能力，必要时咨询合格顾问。你对自己的决定和结果负全部责任。",
					],
				},
			],
		},
		cookies: {
			title: "Cookie 政策",
			intro:
				"本政策说明 Tradely 使用哪些浏览器存储和 Cookie，以保持学习中心可靠并记住你的选择。",
			lastUpdated: "最后更新：2026 年 8 月 28 日",
			sections: [
				{
					heading: "必要存储",
					paragraphs: [
						"身份验证和安全 Cookie 或浏览器存储用于支持 Clerk 会话、请求保护以及会员课程访问。没有这些存储，登录和受保护媒体无法可靠工作。",
					],
				},
				{
					heading: "偏好存储",
					paragraphs: [
						"Tradely 会在浏览器保存主题和语言偏好，让界面下次以你选择的模式打开。这些偏好不会用于在无关网站识别你。",
					],
				},
				{
					heading: "可选统计",
					paragraphs: [
						"Tradely 会以默认退出状态初始化 PostHog。在你选择允许分析前，不会发送分析事件。同意后，PostHog 可能使用浏览器存储和 Cookie，把同一会话中的页面使用、学习里程碑、Web Vitals 和错误诊断关联起来。Tradely 已关闭 PostHog 的元素文字自动采集、会话回放、热图、问卷和控制台日志采集。",
						"PostHog 分析仅用于产品改进和可靠性，不用于广告。登录后仅使用 Clerk 用户 ID 作为分析标识，不会发送邮箱地址、课程正文或付款信息。",
					],
				},
				{
					heading: "你的控制权",
					paragraphs: [
						"你可以随时通过 Tradely 页脚的隐私设置允许或撤回可选分析。撤回同意会停止采集并重置 PostHog 浏览器身份。你也可以通过浏览器设置清除或阻止 Cookie；阻止必要存储可能导致退出登录，或使账单和受保护课程功能无法运行。",
					],
				},
			],
		},
	},
};

export function getLegalDocument(
	page: LegalPageId,
	locale: Locale,
): LegalDocument {
	return documents[locale][page] ?? documents.en[page];
}
