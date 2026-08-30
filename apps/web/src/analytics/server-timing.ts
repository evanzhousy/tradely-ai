import type { AnalyticsEventMap } from "./events";

export type ServerRouteTimingContext = AnalyticsEventMap["server_route_timing"];

const SLOW_ROUTE_TIMING_THRESHOLD_MS = 1_000;
const MAX_ROUTE_TIMING_MS = 60_000;

export function boundedServerTimingMs(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(MAX_ROUTE_TIMING_MS, Math.max(0, Math.round(value)));
}

export function shouldCaptureServerTiming(value: number): boolean {
	return Number.isFinite(value) && value >= SLOW_ROUTE_TIMING_THRESHOLD_MS;
}
