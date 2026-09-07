import type { LearningCopy } from "@/domain/learning/types";

export const replayCopy = {
	replayTitle: { en: "Illustrative session replay", zh: "模拟时段回放" },
	playReplay: { en: "Play session", zh: "播放时段" },
	pauseReplay: { en: "Pause", zh: "暂停" },
	replayAgain: { en: "Replay session", zh: "重播时段" },
	closeSnapshot: { en: "Closing snapshot", zh: "收盘快照" },
	replaySpeed: { en: "Replay speed", zh: "回放速度" },
	replayTimeline: { en: "Session timeline", zh: "时段时间轴" },
	seekTo: { en: "View", zh: "查看" },
	reducedReplay: {
		en: "Reduced motion: playback steps through snapshots. You can also select a time directly.",
		zh: "减少动态效果：回放按快照逐步切换，也可直接选择时间。",
	},
} satisfies Record<string, LearningCopy>;
