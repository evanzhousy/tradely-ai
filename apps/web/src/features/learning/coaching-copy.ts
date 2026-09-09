export const coachingCopy = {
	title: { en: "Check my reasoning", zh: "检查我的判断" },
	intro: {
		en: "Use the evidence to explain your answer, then improve it with two rounds of coaching.",
		zh: "用证据解释答案，通过两轮辅导完善你的理由。",
	},
	notice: {
		en: "Starting sends this case and your saved explanation to our AI provider through Vercel AI Gateway. Feedback supports practice; it does not certify mastery.",
		zh: "开始后，本案例和你保存的解释会经 Vercel AI Gateway 发送给 AI 提供方。反馈用于练习，不代表掌握认证。",
	},
	reason: { en: "Explain your judgment", zh: "解释你的判断理由" },
	reasonHelp: {
		en: "Name the evidence, what it supports, and what remains unknown (40–1800 characters).",
		zh: "写出证据、它支持什么，以及仍未知的部分（40–1800 字符）。",
	},
	sourceReason: {
		en: "Your saved explanation above is used here. Edit and save that answer to revise it.",
		zh: "这里使用上方已保存的文字回答。要修改理由，请在原题中修改并保存。",
	},
	save: { en: "Save explanation", zh: "保存理由" },
	saved: { en: "Explanation saved", zh: "理由已保存" },
	initial: { en: "Review my reasoning", zh: "检查我的判断" },
	revision: { en: "Check my revision", zh: "检查修改" },
	working: {
		en: "Reviewing your saved explanation… You can continue the lesson.",
		zh: "正在检查你保存的理由……你仍可继续课程。",
	},
	before: { en: "Original explanation", zh: "原始理由" },
	after: { en: "Revised explanation", zh: "修订理由" },
	support: { en: "Supported by the evidence", zh: "有证据支持的部分" },
	gaps: { en: "What to revisit", zh: "需要补充的地方" },
	question: { en: "One question to consider", zh: "想一想这个问题" },
	change: { en: "What changed", zh: "本次修改" },
	reference: { en: "Evidence in this review", zh: "本轮反馈所依据的证据" },
	done: {
		en: "Coaching complete. Submit the guided case, then try the independent case with different evidence.",
		zh: "本轮辅导已完成。提交引导案例后，再用不同证据完成独立案例。",
	},
	stale: {
		en: "This feedback describes the saved explanation shown here, not your newer answers or current case.",
		zh: "此反馈针对这里展示的已保存理由，不针对你更新后的答案或当前案例。",
	},
	download: { en: "Download coaching record", zh: "下载辅导记录" },
	remove: { en: "Delete coaching record", zh: "删除辅导记录" },
	removed: {
		en: "Coaching text deleted. Your original lesson answers remain saved.",
		zh: "辅导文字已删除，原课程答案仍保留。",
	},
	recover: { en: "Check saved status", zh: "查看已保存状态" },
	hint: { en: "Show lesson hint", zh: "查看课程提示" },
	draft: {
		en: "Save your edited answers and explanation before requesting feedback.",
		zh: "请求反馈前，请保存修改过的答案和理由。",
	},
	history: { en: "Feedback language", zh: "反馈语言" },
} as const;
export const coachingErrors = {
	signed_out: ["Sign in to save coaching.", "登录后可保存辅导。"],
	access_denied: [
		"Current course access is required.",
		"需要当前课程的访问权限。",
	],
	unavailable: [
		"Coaching is temporarily unavailable. Your practice still works.",
		"辅导暂不可用，你仍可继续练习。",
	],
	not_found: ["This coaching record is unavailable.", "无法找到本次辅导记录。"],
	disabled: [
		"New coaching is paused. Saved feedback is still available.",
		"新辅导已暂停，仍可查看已有反馈。",
	],
	not_eligible: [
		"This account is not in the coaching pilot.",
		"此账户暂未加入辅导试点。",
	],
	invalid_action: [
		"Coaching is available before submitting the guided case.",
		"请在提交引导案例之前使用辅导。",
	],
	conflict: [
		"Your saved work changed. Check the latest saved status before continuing.",
		"已保存的内容有变化，请先读取最新状态。",
	],
	retired: [
		"This case or coaching version has changed. Start the current lesson attempt.",
		"案例或辅导版本已更新，请开始当前版本的练习。",
	],
	incomplete: [
		"Save a complete explanation; for a second review, revise your reasoning first.",
		"请保存完整理由；第二轮检查前需要先修改你的判断。",
	],
	quota_exceeded: [
		"You have used today's coaching sessions. Existing sessions can still finish; new sessions reset at 00:00 UTC.",
		"今日新辅导额度已用完。已有辅导仍可完成，新额度在 UTC 00:00 重置。",
	],
	budget_exceeded: [
		"New coaching is paused for today's pilot budget. Use the lesson hint or return later.",
		"今日试点预算已用完，暂时无法开始新辅导。可使用课程提示或稍后再来。",
	],
	context_too_large: [
		"This explanation is too long to review with its evidence. Shorten it and save again.",
		"理由与证据合计过长，请精简理由后保存。",
	],
	invalid_output: [
		"This feedback could not be verified. Use the lesson hint and continue practice.",
		"本次反馈未通过校验，请使用课程提示继续练习。",
	],
	indeterminate: [
		"We could not confirm the AI response. Check saved status; we will not automatically send or charge for another request.",
		"暂时无法确认 AI 响应，请查看已保存状态。系统不会自动重复请求和计费。",
	],
	deleted: ["This coaching record has been deleted.", "此辅导记录已删除。"],
} as const;
