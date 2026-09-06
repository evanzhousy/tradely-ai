/** Artistic sunset progression; scene-relative angles, not a geographic sun calculation. */
export function sunsetLighting(direction: number, progress: number) {
	const t = Math.max(0, Math.min(1, progress));
	const elevation = 55 - t * 61;
	const azimuth = ((((direction % 360) + 360) % 360) * Math.PI) / 180;
	const altitude = (elevation * Math.PI) / 180;
	const daylight = Math.max(0, Math.sin(altitude));
	return {
		elevation,
		position: [
			Math.sin(azimuth) * Math.cos(altitude) * 30,
			Math.sin(altitude) * 30,
			Math.cos(azimuth) * Math.cos(altitude) * 30,
		] as const,
		intensity: elevation <= 0 ? 0 : 3.5 * Math.min(1, daylight / 0.25),
		ambient: 0.22 + 2.18 * (1 - t),
		warmth: Math.min(1, t * 1.2),
	};
}
