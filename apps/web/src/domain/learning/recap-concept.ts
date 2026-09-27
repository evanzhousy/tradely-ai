export function apparentBarRatio(
	larger: number,
	smaller: number,
	axisMinimum: number,
) {
	if (
		![larger, smaller, axisMinimum].every(Number.isFinite) ||
		axisMinimum < 0 ||
		larger <= axisMinimum ||
		smaller <= axisMinimum
	)
		return null;
	return (larger - axisMinimum) / (smaller - axisMinimum);
}
