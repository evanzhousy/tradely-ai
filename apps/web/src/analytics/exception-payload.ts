import { sanitizeAnalyticsUrl } from "./events";
import { redactAnalyticsText } from "./redaction";

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Automatic exceptions bypass safeAnalyticsError. Sanitize their serialized
// messages and frames at the shared send boundary, preserving symbol-map IDs.
export function redactPostHogExceptions(properties: Record<string, unknown>) {
	for (const key of ["$exception_message", "$exception_type"]) {
		if (typeof properties[key] === "string") {
			properties[key] = redactAnalyticsText(properties[key], 500);
		}
	}
	// Breadcrumbs can contain arbitrary application values; Tradely doesn't use them.
	delete properties.$exception_steps;
	if (!Array.isArray(properties.$exception_list)) return;
	properties.$exception_list = properties.$exception_list.slice(0, 10);
	for (const exception of properties.$exception_list as unknown[]) {
		if (!isRecord(exception)) continue;
		for (const key of ["type", "value"]) {
			if (typeof exception[key] === "string") {
				exception[key] = redactAnalyticsText(
					exception[key],
					key === "type" ? 120 : 500,
				);
			}
		}
		if (!isRecord(exception.stacktrace)) continue;
		const frames = exception.stacktrace.frames;
		if (!Array.isArray(frames)) continue;
		exception.stacktrace.frames = frames.slice(-50);
		for (const frame of exception.stacktrace.frames as unknown[]) {
			if (!isRecord(frame)) continue;
			for (const key of ["filename", "abs_path", "function", "module"]) {
				if (typeof frame[key] !== "string") continue;
				const value =
					key === "filename" || key === "abs_path"
						? (sanitizeAnalyticsUrl(frame[key]) as string)
						: frame[key];
				frame[key] = redactAnalyticsText(value, 1000);
			}
			for (const key of [
				"vars",
				"locals",
				"context_line",
				"pre_context",
				"post_context",
			]) {
				delete frame[key];
			}
		}
	}
}
