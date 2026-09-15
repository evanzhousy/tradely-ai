export type SceneCopy = readonly [string, string];
export type VisualStep = {
	id: string;
	label: SceneCopy;
	caption: SceneCopy;
	holdMs: number;
	focus: "diagram" | "result";
	state: { position: number };
};

/** A step owns the sampled model position, caption, focus and reading time together. */
export function teachingSteps(
	captions: readonly SceneCopy[],
	labels?: readonly SceneCopy[],
): readonly VisualStep[] {
	const count = Math.max(3, captions.length, labels?.length ?? 0);
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
			label:
				labels?.[i] ??
				([
					i === 0
						? "Starting state"
						: i === count - 1
							? "Result"
							: `Change ${i}`,
					i === 0 ? "起始状态" : i === count - 1 ? "结果" : `变化 ${i}`,
				] as const),
			focus: i === count - 1 ? "result" : "diagram",
			holdMs: Math.min(
				6000,
				Math.max(2600, caption[0].split(/\s+/).length * 160),
			),
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
	const generic = steps.every(
		(step) =>
			/^(Starting state|Change \d+|Result)$/.test(step.label[0]) &&
			step.caption[0] === steps[0].caption[0] &&
			step.caption[1] === steps[0].caption[1],
	);
	// A shared caption does not need artificial stops between the actual snapshots.
	const positions = new Set(
		generic && frameCounts.some((count) => count > 1)
			? []
			: steps.map((step) => step.state.position),
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
				label: generic
					? ([
							i === 0
								? "Starting state"
								: i === all.length - 1
									? "Result"
									: `Change ${i}`,
							i === 0
								? "起始状态"
								: i === all.length - 1
									? "结果"
									: `变化 ${i}`,
						] as const)
					: nearest.label,
				id: `frame-${i}`,
				state: { position },
				focus: i === all.length - 1 ? "result" : "diagram",
			};
		});
}
