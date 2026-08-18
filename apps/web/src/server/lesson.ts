import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getLessonPageData = createServerFn({ method: "GET" })
	.validator(z.object({ slug: z.string().min(1) }))
	.handler(async ({ data }) => {
		const { getLessonPageDataImpl } = await import("./lesson.server");
		return getLessonPageDataImpl(data);
	});
