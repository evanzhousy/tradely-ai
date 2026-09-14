import { z } from "zod";
import {
	type LearningFailure,
	type LearningView,
	learningActionSchema,
} from "./learning/types";

const lessonId = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[a-z0-9-]+$/);
export const guestScenarioSchema = z
	.object({
		scenarioId: lessonId,
		scenarioVersion: z.number().int().positive(),
		contentVersion: z.number().int().positive(),
	})
	.strict();
export const guestWorkSchema = guestScenarioSchema
	.extend({
		lessonId,
		variant: z.number().int().min(0).max(1),
		actions: z.array(learningActionSchema).max(256),
		intent: z.enum(["result", "place", "research"]),
	})
	.strict();
export type GuestWork = z.infer<typeof guestWorkSchema>;
export type GuestSaveIntent = GuestWork["intent"];

export const guestImportSchema = z
	.object({
		transferId: z.string().uuid(),
		expectedUserId: z.string().min(1).max(200),
		work: guestWorkSchema,
		saveSeparately: z.boolean().default(false),
	})
	.strict();
export type GuestImportInput = z.infer<typeof guestImportSchema>;
export type GuestImportFailure =
	| LearningFailure
	| "account_changed"
	| "existing_work"
	| "transfer_conflict";
export type GuestImportResponse =
	| { ok: true; view: LearningView; completed: boolean; replayed: boolean }
	| {
			ok: false;
			reason: GuestImportFailure;
			existingAttemptId?: string;
			canSaveSeparately?: boolean;
	  };

export function parseLearningSearch(search: Record<string, unknown>): {
	attempt?: string;
	saveGuest?: "1";
} {
	const attempt = z.string().uuid().safeParse(search.attempt);
	return {
		attempt: attempt.success ? attempt.data : undefined,
		saveGuest: search.saveGuest === "1" ? ("1" as const) : undefined,
	};
}
