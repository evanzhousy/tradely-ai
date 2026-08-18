import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const saveLessonProgressSchema = z.object({
	lessonId: z.string().min(1),
	lastPositionSeconds: z.number().int().nonnegative().nullable().optional(),
	complete: z.boolean().optional(),
});

export type SaveLessonProgressInput = z.infer<typeof saveLessonProgressSchema>;

export const getCourseProgress = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getCourseProgressImpl } = await import("./progress.server");
		return getCourseProgressImpl();
	},
);

export const saveLessonProgress = createServerFn({ method: "POST" })
	.validator(saveLessonProgressSchema)
	.handler(async ({ data }) => {
		const { saveLessonProgressImpl } = await import("./progress.server");
		return saveLessonProgressImpl(data);
	});
