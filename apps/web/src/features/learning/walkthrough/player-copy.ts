import type { Copy } from "@/content/world";

export const playerCopy = {
	modes: ["Lesson views", "课程视图"],
	watch: ["Watch", "观看"],
	playground: ["Try it yourself", "自己试一试"],
	timeline: ["Film timeline", "影片时间轴"],
	shot: ["Shot", "镜头"],
	speed: ["Speed", "速度"],
	openPlayground: ["Try it yourself", "自己试一试"],
	replay: ["Replay", "重播"],
	challenges: ["Challenges", "挑战"],
	allDone: ["Every challenge done", "所有挑战已完成"],
	allDoneNote: [
		"Now check yourself on a new case.",
		"现在用一个新案例检验自己。",
	],
	ended: ["That's the whole idea", "这就是全部要点"],
	endedNote: [
		"Predict what each scene will show, then change the example yourself.",
		"先预测每个场景会显示什么，再自己调整示例。",
	],
	skipPrediction: ["Skip to the playground", "跳过，直接动手"],
} as const satisfies Record<string, Copy>;
