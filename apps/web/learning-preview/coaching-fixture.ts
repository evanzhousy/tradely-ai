/** Explicit UI fixture only: no provider, database, auth, persistence or analytics. */
import type { LessonAttempt } from "@tradely/db";
import { getCoachingLesson } from "../src/content/coaching/index.server";
import { sameWork } from "../src/domain/coaching/policy";
import { exampleFeedback } from "../src/domain/coaching/test-fixtures";
import {
	CoachingError,
	type CoachingSessionView,
	projectCoachingSnapshot,
} from "../src/domain/coaching/types";
import type { CoachingTransport } from "../src/features/learning/coaching-panel";
import { buildCoachingSnapshot } from "../src/server/coaching-context.server";

export function coachingFixture(
	record: () => LessonAttempt,
): CoachingTransport {
	let session: CoachingSessionView | null = null;
	const view = () => ({
		ok: true as const,
		view: {
			available: true,
			reason: null,
			reasonQuestionId:
				getCoachingLesson(record().lessonId)?.reasonQuestionId ?? null,
			session: structuredClone(session),
		},
	});
	return {
		read: async () => view(),
		update: async (input) => {
			try {
				if (input.action.type === "delete") {
					if (session)
						session = {
							...session,
							revision: session.revision + 1,
							deleted: true,
							draftReason: "",
							initial: null,
							revised: null,
							generations: [],
						};
					return view();
				}
				if (session?.deleted) throw new CoachingError("deleted");
				session ??= {
					id: crypto.randomUUID(),
					revision: 0,
					locale: input.locale,
					draftReason: "",
					initial: null,
					revised: null,
					generations: [],
					deleted: false,
					stale: false,
				};
				if (input.action.type === "save")
					session.draftReason = input.action.reason;
				else {
					const snapshot = buildCoachingSnapshot(
						record(),
						session.locale,
						session.draftReason,
					);
					if (
						input.action.round === "revision" &&
						session.initial &&
						sameWork(session.initial, snapshot)
					)
						throw new CoachingError("incomplete");
					if (input.action.round === "initial")
						session.initial = projectCoachingSnapshot(snapshot);
					else session.revised = projectCoachingSnapshot(snapshot);
					await new Promise((resolve) => setTimeout(resolve, 350));
					session.generations.push({
						id: crypto.randomUUID(),
						round: input.action.round,
						status: "succeeded",
						feedback: exampleFeedback(
							snapshot,
							input.action.round === "revision",
						),
						error: null,
					});
				}
				session.revision++;
				return view();
			} catch (error) {
				return {
					ok: false,
					reason: error instanceof CoachingError ? error.reason : "unavailable",
				};
			}
		},
	};
}
