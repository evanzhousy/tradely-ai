export type SceneCopy = readonly [string, string];
export type VisualStep = {
	id: string;
	label: SceneCopy;
	caption: SceneCopy;
	holdMs: number;
	focus: "diagram" | "result";
	state: { position: number };
};

/** Reading time at about 200 words a minute, plus time to look at the diagram. */
export function readingHoldMs(caption: string) {
	const words = caption.trim().split(/\s+/).filter(Boolean).length;
	return Math.min(16000, Math.max(4000, words * 300 + 1500));
}

/** A step owns the sampled model position, caption, focus and reading time together. */
export function teachingSteps(
	captions: readonly SceneCopy[],
	labels: readonly SceneCopy[],
): readonly VisualStep[] {
	const count = Math.max(3, captions.length, labels.length);
	return Array.from({ length: count }, (_, i) => {
		const position = i / (count - 1);
		const caption = captions[Math.round(position * (captions.length - 1))] ?? [
			"",
			"",
		];
		return {
			id: `step-${i + 1}`,
			state: { position },
			caption,
			label: labels[Math.round(position * (labels.length - 1))] ?? labels[0],
			focus: i === count - 1 ? "result" : "diagram",
			holdMs: readingHoldMs(caption[0]),
		};
	});
}

/** Explicit evidence stops can be supplied from the same authored source as the model snapshots. */
export function labelSteps(
	steps: readonly VisualStep[],
	labels: readonly SceneCopy[],
): readonly VisualStep[] {
	return teachingSteps(
		steps.map((s) => s.caption),
		labels,
	);
}

/** Include every authored snapshot; never skip a discrete event because its caption is shared. */
export function expandSteps(
	steps: readonly VisualStep[],
	frameCounts: readonly number[],
): readonly VisualStep[] {
	const hasAuthoredFrames = frameCounts.some((count) => count > 1);
	const positions = new Set(
		hasAuthoredFrames ? [] : steps.map((step) => step.state.position),
	);
	for (const count of frameCounts)
		for (let i = 0; i < count; i++)
			positions.add(count > 1 ? i / (count - 1) : 0);
	return [...positions]
		.sort((a, b) => a - b)
		.map((position, i, all) => {
			const nearest = steps.reduce((a, b) =>
				Math.abs(a.state.position - position) <=
				Math.abs(b.state.position - position)
					? a
					: b,
			);
			return {
				...nearest,
				id: `frame-${i}`,
				state: { position },
				focus: i === all.length - 1 ? "result" : "diagram",
			};
		});
}
