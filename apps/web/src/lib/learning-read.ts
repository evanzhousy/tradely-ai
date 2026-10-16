import type { AnalyticsEventMap } from "@/analytics/events";

export type LearningReadOutcome = AnalyticsEventMap["learning_read_finished"];
type Operation = LearningReadOutcome["operation"];
type Failure = NonNullable<LearningReadOutcome["failure_category"]>;

/** Only transport failures from these public/read-only server functions may retry. */
export class LearningReadError extends Error {
	constructor(
		readonly operation: Operation,
		readonly category: Failure,
		readonly attempt: number,
		readonly durationMs: number,
		readonly httpStatus?: number,
	) {
		super(`Learning read unavailable: ${operation} (${category})`);
		this.name = "LearningReadError";
	}
}

export function learningReadFailureContext(error: unknown) {
	if (!(error instanceof LearningReadError)) return {};
	return {
		operation: error.operation,
		failure_category: error.category,
		attempt: error.attempt,
		duration_ms: error.durationMs,
		http_status: error.httpStatus,
	};
}

/** Owns browser read transport; cancellation is silent and writes never enter here. */
export async function readLearningData<T>({
	operation,
	run,
	signal,
	onOutcome,
}: {
	operation: Operation;
	run: (options: { signal?: AbortSignal; fetch?: typeof fetch }) => Promise<T>;
	signal?: AbortSignal;
	onOutcome?: (outcome: LearningReadOutcome) => void;
}): Promise<T> {
	// SSR invokes server functions directly; there is no browser transport to retry.
	if (typeof window === "undefined") return run({ signal });
	const started = performance.now();
	const duration = () =>
		Math.min(60_000, Math.round(performance.now() - started));
	let firstFailure: Failure | undefined;
	for (let attempt = 1; attempt <= 2; attempt++) {
		signal?.throwIfAborted();
		const timeout = AbortSignal.timeout(8_000);
		const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
		const readFetch: typeof fetch = async (input, init) => {
			if ((init?.method ?? "GET").toUpperCase() !== "GET")
				throw new Error("Learning read transport requires GET");
			let response: Response;
			try {
				response = await fetch(input, { ...init, signal: requestSignal });
			} catch {
				signal?.throwIfAborted();
				throw new LearningReadError(
					operation,
					timeout.aborted
						? "timeout"
						: navigator.onLine === false
							? "offline"
							: "network",
					attempt,
					duration(),
				);
			}
			if (!response.ok)
				throw new LearningReadError(
					operation,
					"http",
					attempt,
					duration(),
					response.status,
				);
			return response;
		};
		try {
			const result = await run({ signal: requestSignal, fetch: readFetch });
			onOutcome?.({
				operation,
				outcome: attempt === 1 ? "ok" : "recovered",
				attempt,
				duration_ms: duration(),
				failure_category: firstFailure,
			});
			return result;
		} catch (error) {
			signal?.throwIfAborted();
			const failure =
				error instanceof LearningReadError
					? error
					: new LearningReadError(
							operation,
							timeout.aborted ? "timeout" : "unexpected",
							attempt,
							duration(),
						);
			firstFailure ??= failure.category;
			const retryable =
				failure.category === "network" ||
				(failure.category === "http" &&
					[502, 503, 504].includes(failure.httpStatus ?? 0));
			if (attempt === 1 && retryable) {
				await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
				continue;
			}
			onOutcome?.({
				operation,
				outcome: "unavailable",
				attempt,
				duration_ms: duration(),
				failure_category: failure.category,
				http_status: failure.httpStatus,
			});
			throw failure;
		}
	}
	throw new Error("Learning read attempts exhausted");
}
