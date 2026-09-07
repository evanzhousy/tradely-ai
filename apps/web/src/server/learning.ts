import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { learningActionSchema } from "@/domain/learning/types";

const lessonId = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[a-z0-9-]+$/);
export const openLearningSchema = z
	.object({ lessonId, restart: z.boolean().default(false) })
	.strict();
export const updateLearningSchema = z
	.object({
		lessonId,
		attemptId: z.string().uuid(),
		revision: z.number().int().nonnegative(),
		commandId: z.string().uuid(),
		action: learningActionSchema,
	})
	.strict();

export type OpenLearningInput = z.infer<typeof openLearningSchema>;
export type UpdateLearningInput = z.infer<typeof updateLearningSchema>;

export const openLearning = createServerFn({ method: "POST" })
	.validator(openLearningSchema)
	.handler(async ({ data }) => {
		const { openLearningImpl } = await import("./learning.server");
		return openLearningImpl(data);
	});

export const updateLearning = createServerFn({ method: "POST" })
	.validator(updateLearningSchema)
	.handler(async ({ data }) => {
		const { updateLearningImpl } = await import("./learning.server");
		return updateLearningImpl(data);
	});
