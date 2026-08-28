export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "tradely.locale";

const messages = {
	en: {
		"brand.home": "Tradely home",
		"nav.primary": "Primary navigation",
		"nav.mobile": "Mobile navigation",
		"nav.learn": "Learn",
		"nav.course": "Course",
		"nav.pricing": "Pricing",
		"nav.openTradingFlow": "Open TradingFlow",
		"nav.openMenu": "Open menu",
		"nav.mobileTitle": "Tradely",
		"nav.mobileDescription": "Options learning with TradingFlow practice.",
		"language.label": "Language",
		"language.english": "English",
		"language.chinese": "中文",
		"theme.light": "Use light theme",
		"theme.dark": "Use dark theme",
		"auth.localPreview": "Local preview",
		"auth.signIn": "Sign in",
		"auth.loading": "Loading account",
		"common.startLearning": "Start learning",
		"common.startLessonOne": "Start with lesson one",
		"common.viewCompleteCourse": "View the complete course",
		"common.previous": "Previous",
		"common.next": "Next",
		"common.retry": "Retry",
		"common.close": "Close",
		"common.notFound": "Page not found",
		"common.notFoundDescription":
			"That address does not point to a Tradely page. Return to the learning hub or open the course index.",
		"common.errorTitle": "Something went wrong",
		"common.errorDescription":
			"Tradely could not load this page. Retry the request or return to the learning hub.",
		"common.returnHome": "Return home",
		"common.returnCourse": "Return to the course",
		"common.skipToContent": "Skip to content",
		"common.freePreview": "Free preview",
		"common.free": "Free",
		"common.unlocked": "Unlocked",
		"common.membership": "Membership",
		"common.membershipLesson": "Membership lesson",
		"common.accessUnavailable": "Access status unavailable",
		"common.completed": "Completed",
		"common.lessonNumber": "Lesson {current} of {total}",
		"common.minutes": "{minutes} min",
		"progress.course": "Course progress",
		"progress.completedLabel": "{completed} of {total} lessons completed",
		"progress.synced": "Synced to your Tradely account.",
		"progress.signInToSync": "Sign in to sync progress across devices.",
		"progress.accountCurrent": "Account progress is current.",
		"progress.signInToRecord": "Sign in to record completion.",
		"home.coursePractice": "{count} lessons · TradingFlow practice",
		"home.heroTitle": "Read the market. Then verify the story.",
		"home.heroDescription":
			"A guided options curriculum that turns flow, ranking, Greeks, GEX, and open interest into one repeatable research workflow—with real practice in TradingFlow.",
		"home.partnerDisclosure":
			"TradingFlow is an independent partnered service. Its own account or subscription may be required.",
		"home.workflowTitle": "One workflow across the full course",
		"home.workflowDescription":
			"Discover → inspect → validate → compare freshness → decide what remains unknown.",
		"home.courseEyebrow": "THE COURSE",
		"home.courseHeading": "A field manual, not a video library.",
		"home.courseDescription":
			"Each lesson explains one decision, shows the relevant evidence, and ends with a bounded task in TradingFlow.",
		"home.learningRecord": "Your learning record",
		"home.independentProducts":
			"Independent products · official practice partnership",
		"home.partnerHeading": "Learn in Tradely. Practice in TradingFlow.",
		"home.partnerDescription":
			"Tradely keeps your curriculum and progress. TradingFlow remains the real analysis environment, with separate customer accounts and infrastructure.",
		"course.practiceBadge": "TradingFlow practice course",
		"course.freeLessons": "{count} free lessons",
		"course.yourProgress": "Your progress",
		"course.curriculum": "Curriculum",
		"course.curriculumDescription":
			"Follow the path in order, or open any lesson to review its place in the workflow.",
		"practice.badge": "Official practice tool",
		"practice.open": "Open TradingFlow",
		"practice.disclosure":
			"TradingFlow is a separate partnered service. An account or subscription may be required.",
		"access.refreshTitle": "Access could not be refreshed",
		"access.refreshDescription":
			"Tradely could not confirm the current billing state. Retry before assuming this account needs to upgrade.",
		"access.signInTitle": "Sign in to continue",
		"access.signInDescription":
			"This member lesson is tied to an individual Tradely account and learning record.",
		"access.clerkUnavailable": "Clerk is not configured locally",
		"access.membershipTitle": "Membership lesson",
		"access.membershipDescription":
			"Unlock the complete curriculum, persistent progress, and every future course update.",
		"access.viewMembership": "View membership",
		"video.unavailableTitle": "Video is temporarily unavailable",
		"video.unavailableDescription":
			"The written lesson remains available. Tradely could not issue a protected media URL.",
		"video.accessibleDescription":
			"The written lesson below provides the complete accessible explanation and practice instructions.",
		"video.browserFallback": "Your browser does not support HTML video.",
		"lesson.navigation": "Lesson navigation",
		"lesson.courseNavigation": "Course navigation · {percentage}% complete",
		"lesson.writtenLesson": "Written lesson",
		"lesson.englishNotice":
			"The lesson text is currently available in English; the surrounding controls and course metadata follow your selected language.",
		"complete.lesson": "Complete lesson",
		"complete.saving": "Saving…",
		"complete.success": "Lesson completed",
		"complete.signInError": "Sign in to save progress",
		"complete.saveError": "This lesson could not be saved",
		"complete.unavailable":
			"Progress is unavailable. Your lesson remains open.",
		"pricing.membership": "Tradely membership",
		"pricing.heading": "Keep the whole learning path open.",
		"pricing.description":
			"One Tradely membership unlocks the paid curriculum and your learning record. TradingFlow remains a separate partnered service.",
		"pricing.taxNote":
			"Taxes are not enabled automatically. Tradely will configure collection only after applicable registrations and tax treatment are confirmed.",
		"pricing.checkoutDescription":
			"Stripe-hosted checkout and self-service billing management.",
		"pricing.configuredInStripe": "Configured in Stripe",
		"pricing.unlock": "Unlock the curriculum",
		"pricing.openingCheckout": "Opening checkout…",
		"pricing.manageBilling": "Manage billing",
		"pricing.localPreview":
			"Local preview: add Stripe API and Price IDs to enable checkout.",
		"pricing.billingUnavailable": "Billing is unavailable",
		"pricing.featureCurriculum":
			"Complete Evidence-Led Options Research curriculum",
		"pricing.featureProgress": "Persistent lesson progress across devices",
		"pricing.featureUpdates":
			"Every future lesson and course update while active",
		"pricing.featurePractice":
			"TradingFlow practice assignments and direct tool links",
		"footer.description":
			"Evidence-led options learning for traders who want a repeatable research process.",
		"footer.partner":
			"TradingFlow is an independent partnered practice service.",
		"footer.legal": "Legal",
		"footer.privacy": "Privacy",
		"footer.terms": "Terms",
		"footer.risk": "Risk disclosure",
		"footer.cookies": "Cookies",
		"footer.privacyChoices": "Privacy choices",
		"footer.rights": "© {year} Tradely. All rights reserved.",
		"legal.lastUpdated": "Last updated: August 28, 2026",
		"legal.backToLearning": "Back to learning hub",
		"analytics.consentTitle": "Help improve Tradely",
		"analytics.consentDescription":
			"Allow privacy-limited PostHog analytics for page usage, learning milestones, performance, and error diagnostics. No lesson text, payment details, or email address is sent.",
		"analytics.allow": "Allow analytics",
		"analytics.necessaryOnly": "Use necessary only",
	},
	zh: {
		"brand.home": "Tradely 首页",
		"nav.primary": "主导航",
		"nav.mobile": "移动导航",
		"nav.learn": "学习",
		"nav.course": "课程",
		"nav.pricing": "会员",
		"nav.openTradingFlow": "打开 TradingFlow",
		"nav.openMenu": "打开菜单",
		"nav.mobileTitle": "Tradely",
		"nav.mobileDescription": "用 TradingFlow 练习期权研究。",
		"language.label": "语言",
		"language.english": "English",
		"language.chinese": "中文",
		"theme.light": "使用浅色主题",
		"theme.dark": "使用深色主题",
		"auth.localPreview": "本地预览",
		"auth.signIn": "登录",
		"auth.loading": "正在加载账户",
		"common.startLearning": "开始学习",
		"common.startLessonOne": "从第一课开始",
		"common.viewCompleteCourse": "查看完整课程",
		"common.previous": "上一课",
		"common.next": "下一课",
		"common.retry": "重试",
		"common.close": "关闭",
		"common.notFound": "页面未找到",
		"common.notFoundDescription":
			"这个地址没有对应的 Tradely 页面。返回学习中心或打开课程目录。",
		"common.errorTitle": "页面加载遇到问题",
		"common.errorDescription":
			"Tradely 无法加载此页面。请重试，或返回学习中心。",
		"common.returnHome": "返回首页",
		"common.returnCourse": "返回课程",
		"common.skipToContent": "跳到主要内容",
		"common.freePreview": "免费预览",
		"common.free": "免费",
		"common.unlocked": "已解锁",
		"common.membership": "会员",
		"common.membershipLesson": "会员课程",
		"common.accessUnavailable": "暂时无法确认访问权限",
		"common.completed": "已完成",
		"common.lessonNumber": "第 {current} 课，共 {total} 课",
		"common.minutes": "{minutes} 分钟",
		"progress.course": "课程进度",
		"progress.completedLabel": "已完成 {completed}/{total} 课",
		"progress.synced": "已同步到你的 Tradely 账户。",
		"progress.signInToSync": "登录后可在不同设备同步进度。",
		"progress.accountCurrent": "账户进度已更新。",
		"progress.signInToRecord": "登录后记录完成状态。",
		"home.coursePractice": "{count} 课 · TradingFlow 练习",
		"home.heroTitle": "读懂市场，再验证你的判断。",
		"home.heroDescription":
			"一套有引导的期权课程，把成交流、排名、Greeks、GEX 和未平仓量串成可重复的研究流程，并在 TradingFlow 中完成真实练习。",
		"home.partnerDisclosure":
			"TradingFlow 是独立运营的合作服务，可能需要单独注册账户或订阅。",
		"home.workflowTitle": "贯穿全课程的一套流程",
		"home.workflowDescription":
			"发现 → 检查 → 验证 → 对比数据时效 → 明确仍未知的部分。",
		"home.courseEyebrow": "课程",
		"home.courseHeading": "一本实战手册，而不是视频目录。",
		"home.courseDescription":
			"每一课聚焦一个决策，展示相关证据，并以 TradingFlow 中一个边界明确的任务收尾。",
		"home.learningRecord": "你的学习记录",
		"home.independentProducts": "独立产品 · 官方练习合作",
		"home.partnerHeading": "在 Tradely 学习，在 TradingFlow 练习。",
		"home.partnerDescription":
			"Tradely 保存你的课程与进度。TradingFlow 仍是独立的分析环境，双方使用各自的账户和基础设施。",
		"course.practiceBadge": "TradingFlow 实战课程",
		"course.freeLessons": "{count} 节免费课程",
		"course.yourProgress": "你的进度",
		"course.curriculum": "课程目录",
		"course.curriculumDescription":
			"按顺序学习，或打开任意课程查看它在整个流程中的位置。",
		"practice.badge": "官方练习工具",
		"practice.open": "打开 TradingFlow",
		"practice.disclosure":
			"TradingFlow 是独立运营的合作服务，可能需要单独账户或订阅。",
		"access.refreshTitle": "暂时无法刷新访问权限",
		"access.refreshDescription":
			"Tradely 无法确认当前账单状态。请先重试，再判断是否需要升级账户。",
		"access.signInTitle": "登录后继续",
		"access.signInDescription":
			"这节会员课程绑定到个人 Tradely 账户和学习记录。",
		"access.clerkUnavailable": "本地尚未配置 Clerk",
		"access.membershipTitle": "会员课程",
		"access.membershipDescription":
			"解锁完整课程、持续进度记录以及未来的课程更新。",
		"access.viewMembership": "查看会员方案",
		"video.unavailableTitle": "视频暂时不可用",
		"video.unavailableDescription":
			"文字课程仍可阅读。Tradely 暂时无法签发受保护的媒体地址。",
		"video.accessibleDescription":
			"下方文字课程提供完整的无障碍说明和练习步骤。",
		"video.browserFallback": "你的浏览器不支持 HTML 视频。",
		"lesson.navigation": "课程导航",
		"lesson.courseNavigation": "课程导航 · 已完成 {percentage}%",
		"lesson.writtenLesson": "文字课程",
		"lesson.englishNotice":
			"当前课程正文为英文；周边控件和课程信息会使用你选择的语言。",
		"complete.lesson": "完成课程",
		"complete.saving": "保存中…",
		"complete.success": "课程已完成",
		"complete.signInError": "登录后才能保存进度",
		"complete.saveError": "无法保存这节课程",
		"complete.unavailable": "进度服务暂不可用，课程仍保持打开。",
		"pricing.membership": "Tradely 会员",
		"pricing.heading": "保持完整学习路径开放。",
		"pricing.description":
			"一个 Tradely 会员账户即可解锁付费课程并保存学习记录。TradingFlow 仍是独立的合作服务。",
		"pricing.taxNote":
			"当前不会自动计算税费。Tradely 会在完成适用注册并确认税务处理后配置收取。",
		"pricing.checkoutDescription": "使用 Stripe 托管结账并自助管理账单。",
		"pricing.configuredInStripe": "已在 Stripe 配置",
		"pricing.unlock": "解锁课程",
		"pricing.openingCheckout": "正在打开结账…",
		"pricing.manageBilling": "管理账单",
		"pricing.localPreview":
			"本地预览：配置 Stripe API 和 Price ID 后启用结账。",
		"pricing.billingUnavailable": "账单服务暂不可用",
		"pricing.featureCurriculum": "完整的证据驱动期权研究课程",
		"pricing.featureProgress": "跨设备保存课程进度",
		"pricing.featureUpdates": "会员有效期内的后续课程与更新",
		"pricing.featurePractice": "TradingFlow 练习任务与直接工具链接",
		"footer.description":
			"为希望建立可重复研究流程的交易者提供证据驱动的期权学习。",
		"footer.partner": "TradingFlow 是独立运营的合作练习服务。",
		"footer.legal": "法律信息",
		"footer.privacy": "隐私政策",
		"footer.terms": "服务条款",
		"footer.risk": "风险披露",
		"footer.cookies": "Cookie 政策",
		"footer.privacyChoices": "隐私设置",
		"footer.rights": "© {year} Tradely。保留所有权利。",
		"legal.lastUpdated": "最后更新：2026 年 8 月 28 日",
		"legal.backToLearning": "返回学习中心",
		"analytics.consentTitle": "帮助改进 Tradely",
		"analytics.consentDescription":
			"允许使用隐私受限的 PostHog 分析，了解页面使用、学习里程碑、性能和错误诊断。不会发送课程正文、付款信息或邮箱地址。",
		"analytics.allow": "允许分析",
		"analytics.necessaryOnly": "仅使用必要功能",
	},
} as const;

export type MessageKey = keyof typeof messages.en;

export const messageKeys = Object.keys(messages.en) as MessageKey[];

export function normalizeLocale(input?: string | null): Locale {
	return input?.toLowerCase().startsWith("zh") ? "zh" : DEFAULT_LOCALE;
}

export function translate(
	locale: Locale,
	key: MessageKey,
	variables?: Record<string, string | number>,
): string {
	const template = messages[locale][key] ?? messages[DEFAULT_LOCALE][key];
	if (!variables) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		String(variables[name] ?? match),
	);
}

export const localeOptions: readonly { value: Locale; labelKey: MessageKey }[] =
	[
		{ value: "en", labelKey: "language.english" },
		{ value: "zh", labelKey: "language.chinese" },
	];
