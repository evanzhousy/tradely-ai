export const guestSaveCopy = {
	title: { en: "Keep what you just learned", zh: "保存刚刚完成的学习成果" },
	description: {
		en: "Create a free account to keep this result and continue where you left off.",
		zh: "创建免费账户，保存本次结果，下次接着学习。",
	},
	result: {
		en: "Save my result — create a free account",
		zh: "保存结果，创建免费账户",
	},
	place: { en: "Save my place", zh: "保存当前进度" },
	research: { en: "Save this research", zh: "保存这份研究" },
	guest: { en: "Continue as guest", zh: "继续以访客身份学习" },
	dirty: {
		en: "Save your edited response before saving your place.",
		zh: "请先保存正在编辑的回答，再保存当前进度。",
	},
	storage: {
		en: "This browser could not keep your work for sign-in. Your exercise is still here; try again or continue as a guest.",
		zh: "浏览器无法暂存登录前的练习。当前练习仍在，请重试或继续以访客身份学习。",
	},
	restoring: { en: "Restoring your guest exercise…", zh: "正在恢复访客练习…" },
	saving: {
		en: "Saving your exercise to your account…",
		zh: "正在将练习保存到账户…",
	},
	saved: { en: "Your result is saved", zh: "结果已保存" },
	savedDraft: { en: "Your progress is saved", zh: "进度已保存" },
	next: { en: "Continue to the next lesson", zh: "继续下一节课" },
	recovery: { en: "Keep your guest work", zh: "保留访客练习" },
	existing_work: {
		en: "You already have an unfinished exercise for this lesson. Your saved work has not been changed.",
		zh: "这节课已有未完成的账户练习，原有记录未被修改。",
	},
	separate: {
		en: "Save this completed result separately",
		zh: "单独保存本次已完成的结果",
	},
	resume: { en: "Resume my existing exercise", zh: "继续原有练习" },
	retry: { en: "Try saving again", zh: "重试保存" },
	account_changed: {
		en: "The signed-in account changed. Confirm the account before saving; your guest copy is still here.",
		zh: "登录账户已改变，请确认后再保存，访客副本仍保留。",
	},
	confirmAccount: { en: "Save to this account", zh: "保存到此账户" },
	retained: {
		en: "Only this pending save is kept in this tab for up to 24 hours. Closing the tab removes the browser copy.",
		zh: "仅此待保存练习会在当前标签页暂存最多 24 小时，关闭标签页将移除浏览器副本。",
	},
	unavailable: {
		en: "Saving is temporarily unavailable. Your guest copy is kept here. Retry without repeating the exercise.",
		zh: "暂时无法保存，访客副本仍保留，可直接重试，无需重做练习。",
	},
	missing: {
		en: "This tab has no pending guest exercise to save. Return to the lesson to continue learning.",
		zh: "当前标签页没有待保存的访客练习，请返回课程继续学习。",
	},
	expired: {
		en: "The temporary guest copy expired after 24 hours. Previously saved account work is unchanged.",
		zh: "临时访客副本已超过 24 小时，已保存的账户记录不受影响。",
	},
	invalid: {
		en: "The temporary guest copy could not be read. Previously saved account work is unchanged.",
		zh: "无法读取临时访客副本，已保存的账户记录不受影响。",
	},
	retired: {
		en: "This exercise version has changed. Your guest copy is kept, but it cannot be saved as the current exercise. Continue with the current lesson when ready.",
		zh: "练习版本已更新，访客副本仍保留，但不能作为当前版本保存。准备好后可继续当前课程。",
	},
	transfer_conflict: {
		en: "This pending save was already used for different work or another account. Nothing has been overwritten.",
		zh: "此待保存记录已用于其他练习或账户，未覆盖任何数据。",
	},
	invalid_action: {
		en: "The exercise could not be validated. Your guest copy is kept; no result was added to your account.",
		zh: "无法验证该练习，访客副本仍保留，未向账户添加结果。",
	},
	signed_out: {
		en: "Sign in again to save your exercise. Your guest copy is still here.",
		zh: "请重新登录保存练习，访客副本仍保留。",
	},
	returnLesson: { en: "Return to the lesson", zh: "返回课程" },
} as const;
