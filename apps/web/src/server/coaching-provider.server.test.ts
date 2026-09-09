import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ generate: vi.fn(), gateway: vi.fn() }));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/env/server", () => ({ env: { AI_GATEWAY_API_KEY: "test-only-inert-key" } }));
vi.mock("ai", () => ({ createGateway: mocks.gateway, generateText: mocks.generate, Output: { object: (input: unknown) => input } }));
import { exampleFeedback, exampleReason, guidedRecord } from "@/domain/coaching/test-fixtures";
import { buildCoachingSnapshot } from "./coaching-context.server";
import { generateCoachingFeedback } from "./coaching-provider.server";

describe("coaching provider contract", () => {
	const snapshot = buildCoachingSnapshot(guidedRecord(), "zh", exampleReason);
	const input = { snapshot, original: null, previousFeedback: null, round: "initial" as const };
	beforeEach(() => { vi.clearAllMocks(); mocks.gateway.mockReturnValue((model: string) => model); mocks.generate.mockResolvedValue({ output: exampleFeedback(snapshot), usage: { inputTokens: 500, outputTokens: 100 } }); });
	it("uses bounded structured output, one provider, zero retries and no text telemetry", async () => {
		const result = await generateCoachingFeedback(input);
		expect(result.costMicros).toBe(1175);
		const options = mocks.generate.mock.calls[0][0];
		expect(options).toMatchObject({ maxRetries: 0, maxOutputTokens: 1200, providerOptions: { gateway: { only: ["anthropic"] } }, experimental_telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false } });
		expect(options.tools).toBeUndefined(); expect(options.prompt).not.toContain("learner-a");
		expect(options.prompt).not.toContain('"accepted"');
	});
	it("rejects unknown references or false blanket approval", async () => {
		mocks.generate.mockResolvedValue({ output: { ...exampleFeedback(snapshot), gaps: [{ criterionId: "comparison", text: "hidden", referenceIds: ["future-case"] }] }, usage: {} });
		await expect(generateCoachingFeedback(input)).rejects.toThrow("invalid_output");
		mocks.generate.mockResolvedValue({ output: { ...exampleFeedback(snapshot), gaps: [], question: null }, usage: {} });
		await expect(generateCoachingFeedback({ ...input, snapshot: { ...snapshot, answers: [{ question: "ratio", answer: "900", checked: false }] } })).rejects.toThrow("invalid_output");
	});
	it("does not record missing usage as zero cost", async () => {
		mocks.generate.mockResolvedValue({ output: exampleFeedback(snapshot), usage: {} });
		expect((await generateCoachingFeedback(input)).costMicros).toBe(46_600);
	});
});
