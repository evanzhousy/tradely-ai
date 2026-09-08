import { describe, expect, it } from "vitest";

import { redactPostHogExceptions } from "./exception-payload";

describe("serialized PostHog exception privacy", () => {
	it("redacts chained errors and frame data while retaining symbolication fields", () => {
		const properties = {
			$exception_steps: [{ message: "private learner note" }],
			$exception_list: [
				{
					type: "Error",
					value: "learner@example.com failed ?token=private",
					mechanism: { handled: false },
					stacktrace: {
						type: "raw",
						frames: [
							{
								filename:
									"https://www.tradely.ai/assets/app.js?token=private#secret",
								function: "loadLesson",
								lineno: 42,
								colno: 3,
								chunk_id: "01a049b9-2ac7-0000-ba7c-fa7312d9f86e",
								vars: { email: "learner@example.com" },
								context_line: "private learner note",
							},
						],
					},
				},
			],
		};
		redactPostHogExceptions(properties);
		expect(properties).not.toHaveProperty("$exception_steps");
		expect(properties.$exception_list[0]).toEqual({
			type: "Error",
			value: "[redacted-email] failed ?token=[redacted]",
			mechanism: { handled: false },
			stacktrace: {
				type: "raw",
				frames: [
					{
						filename: "https://www.tradely.ai/assets/app.js",
						function: "loadLesson",
						lineno: 42,
						colno: 3,
						chunk_id: "01a049b9-2ac7-0000-ba7c-fa7312d9f86e",
					},
				],
			},
		});
		expect(JSON.stringify(properties)).not.toContain("private");
	});

	it("bounds long exception chains, messages and stacks", () => {
		const properties = {
			$exception_list: Array.from({ length: 20 }, () => ({
				type: "E".repeat(1000),
				value: "x".repeat(2000),
				stacktrace: {
					frames: Array.from({ length: 100 }, (_, lineno) => ({ lineno })),
				},
			})),
		};
		redactPostHogExceptions(properties);
		expect(properties.$exception_list).toHaveLength(10);
		expect(properties.$exception_list[0]?.type).toHaveLength(120);
		expect(properties.$exception_list[0]?.value).toHaveLength(500);
		expect(properties.$exception_list[0]?.stacktrace.frames).toHaveLength(50);
	});
});
