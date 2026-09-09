// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	open: vi.fn(),
	update: vi.fn(),
	capture: vi.fn(),
	userId: "learner-a",
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/server/learning", () => ({
	openLearning: mocks.open,
	updateLearning: mocks.update,
}));
vi.mock("@/auth/client", () => ({
	useAuth: () => ({ isLoaded: true, userId: mocks.userId }),
	authIsConfigured: true,
}));
vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({ capture: mocks.capture }),
}));
vi.mock("@/i18n/provider", () => ({ useI18n: () => ({ locale: "en" }) }));

import { optionPrintScenarios } from "@/content/scenarios/option-print";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import type { LearningResponse } from "@/domain/learning/types";
import { LearningExercise } from "./learning-exercise";
import { LearningScreen } from "./learning-screen";

describe("interactive learning UI", () => {
	const scenario = optionPrintScenarios[0];
	const initial = projectAttempt(
		scenario,
		initialAttemptState(),
		"0df1c0d2-43f3-44eb-9149-5565b3e71364",
		0,
	);
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.userId = "learner-a";
		mocks.capture.mockReturnValue(false); // Analytics consent is not needed for learning.
		mocks.open.mockResolvedValue({ ok: true, view: initial });
	});
	afterEach(cleanup);

	it("starts on demand and recovers a lost save response with the same command id", async () => {
		const state = transitionAttempt(scenario, initialAttemptState(), {
			type: "answer",
			questionId: "first-claim",
			choiceId: "execution",
		});
		mocks.update
			.mockRejectedValueOnce(new Error("Network unavailable"))
			.mockResolvedValueOnce({
				ok: true,
				view: projectAttempt(scenario, state, initial.attemptId, 1),
			});
		render(<LearningExercise lessonId="validate-option-print" />);
		expect(mocks.open).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Start or resume practice" }),
		);
		await screen.findByRole("radio", {
			name: "500 calls traded at $2.05; execution premium is $102,500.",
		});
		fireEvent.click(
			screen.getByRole("radio", {
				name: "500 calls traded at $2.05; execution premium is $102,500.",
			}),
		);
		await screen.findByRole("button", { name: "Retry saving" });
		fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
		await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
		expect(mocks.update.mock.calls[0][0]).toEqual(
			mocks.update.mock.calls[1][0],
		);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Commit my judgment" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
	});

	it("tracks a successful open and hint without sending answers or case content", async () => {
		mocks.capture.mockReturnValue(true);
		const hinted = transitionAttempt(scenario, initialAttemptState(), {
			type: "hint",
		});
		mocks.update.mockResolvedValue({
			ok: true,
			view: projectAttempt(scenario, hinted, initial.attemptId, 1),
		});
		render(<LearningExercise lessonId="validate-option-print" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Start or resume practice" }),
		);
		await screen.findByText("A large call print");
		fireEvent.click(screen.getByRole("button", { name: "Show a hint" }));
		await waitFor(() =>
			expect(mocks.capture).toHaveBeenCalledWith("lesson_hint_opened", {
				lesson_id: "validate-option-print",
				scenario_id: initial.scenarioId,
				scenario_version: initial.scenarioVersion,
				stage: "prediction",
			}),
		);
		expect(mocks.capture).toHaveBeenCalledWith("lesson_exercise_started", {
			lesson_id: "validate-option-print",
			scenario_id: initial.scenarioId,
			scenario_version: initial.scenarioVersion,
		});
		for (const [, properties] of mocks.capture.mock.calls) {
			expect(properties).not.toHaveProperty("answers");
			expect(properties).not.toHaveProperty("attemptId");
			expect(properties).not.toHaveProperty("step");
		}
	});

	it("tracks the server's assessment once after submission", async () => {
		mocks.capture.mockReturnValue(true);
		const answered = transitionAttempt(scenario, initialAttemptState(), {
			type: "answer",
			questionId: "first-claim",
			choiceId: "execution",
		});
		mocks.update
			.mockResolvedValueOnce({
				ok: true,
				view: projectAttempt(scenario, answered, initial.attemptId, 1),
			})
			.mockResolvedValueOnce({
				ok: true,
				view: {
					...initial,
					phase: "complete",
					result: { met: 2, total: 3, status: "practiced", usedHint: true },
				},
			});
		const page = render(<LearningExercise lessonId="validate-option-print" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Start or resume practice" }),
		);
		fireEvent.click(
			await screen.findByRole("radio", {
				name: "500 calls traded at $2.05; execution premium is $102,500.",
			}),
		);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Commit my judgment" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		fireEvent.click(screen.getByRole("button", { name: "Commit my judgment" }));
		await waitFor(() =>
			expect(mocks.capture).toHaveBeenCalledWith("lesson_exercise_submitted", {
				lesson_id: "validate-option-print",
				scenario_id: initial.scenarioId,
				scenario_version: initial.scenarioVersion,
				criteria_met: 2,
				criteria_total: 3,
				result: "practiced",
			}),
		);
		page.rerender(<LearningExercise lessonId="validate-option-print" />);
		expect(
			mocks.capture.mock.calls.filter(
				(call) => call[0] === "lesson_exercise_submitted",
			),
		).toHaveLength(1);
	});

	it.each(["unavailable", "access_denied", "conflict"] as const)(
		"tracks an unsuccessful exercise open (%s) without a start event",
		async (reason) => {
			mocks.open.mockResolvedValue({ ok: false, reason });
			render(<LearningExercise lessonId="validate-option-print" />);
			fireEvent.click(
				screen.getByRole("button", { name: "Start or resume practice" }),
			);
			await waitFor(() =>
				expect(mocks.capture).toHaveBeenCalledWith(
					"lesson_exercise_save_failed",
					{ lesson_id: "validate-option-print", reason },
				),
			);
			expect(mocks.capture).toHaveBeenCalledOnce();
		},
	);

	it("drops an old account's pending response after an identity change", async () => {
		let resolve: (value: LearningResponse) => void = () => {};
		mocks.open.mockReturnValue(
			new Promise<LearningResponse>((done) => {
				resolve = done;
			}),
		);
		const result = render(
			<LearningExercise lessonId="validate-option-print" />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Start or resume practice" }),
		);
		mocks.userId = "learner-b";
		result.rerender(<LearningExercise lessonId="validate-option-print" />);
		await act(async () => {
			resolve({ ok: true, view: initial });
		});
		expect(screen.queryByText("A large call print")).toBeNull();
		expect(
			screen.getByRole("button", { name: "Start or resume practice" }),
		).toBeTruthy();
	});

	it("removes paid evidence immediately when the server reports revoked access", async () => {
		mocks.update.mockResolvedValue({ ok: false, reason: "access_denied" });
		render(<LearningExercise lessonId="validate-option-print" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Start or resume practice" }),
		);
		await screen.findByText("A large call print");
		fireEvent.click(screen.getByRole("button", { name: "Show a hint" }));
		await screen.findByText(/does not currently have access/);
		expect(screen.queryByText("A large call print")).toBeNull();
	});

	it("renders the Chinese exercise and named controls without exposing unrevealed context", () => {
		render(
			<LearningScreen
				locale="zh"
				view={initial}
				busy={false}
				error={null}
				onOpen={vi.fn()}
				onAction={vi.fn()}
				onRecover={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "一笔大额看涨期权成交" }),
		).toBeTruthy();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		expect(
			screen.getByRole("radiogroup", { name: "现在可以确定记录什么？" }),
		).toBeTruthy();
		expect(screen.queryByText(/90 秒/)).toBeNull();
		expect(
			screen
				.getByRole("button", { name: "提交初步判断" })
				.hasAttribute("disabled"),
		).toBe(true);
	});
});
