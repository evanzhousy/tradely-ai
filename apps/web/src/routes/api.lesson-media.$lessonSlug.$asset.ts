import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lesson-media/$lessonSlug/$asset")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const { serveLocalLessonMedia } = await import("@/server/media.server");
				return serveLocalLessonMedia({
					request,
					lessonSlug: params.lessonSlug,
					asset: params.asset,
				});
			},
			HEAD: async ({ request, params }) => {
				const { serveLocalLessonMedia } = await import("@/server/media.server");
				return serveLocalLessonMedia({
					request,
					lessonSlug: params.lessonSlug,
					asset: params.asset,
					headOnly: true,
				});
			},
		},
	},
});
