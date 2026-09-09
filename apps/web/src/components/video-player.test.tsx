// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ capture: vi.fn(), save: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.save }));
vi.mock("@/server/progress", () => ({ saveLessonProgress: vi.fn() }));
vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({ capture: mocks.capture }),
}));
vi.mock("@/i18n/provider", () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

import { getLessonById, type Lesson } from "@/content/course";
import { LessonVideo } from "./video-player";

const first = getLessonById("option-contracts") as Lesson;
const second = getLessonById("option-rights") as Lesson;
const media = {
	video: "/lesson.mp4",
	poster: "/poster.jpg",
	captions: "/lesson.vtt",
};

describe("lesson video tracking", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.capture.mockReturnValue(true);
		mocks.save.mockResolvedValue({ saved: true });
	});
	afterEach(cleanup);

	it("tracks the first play once, then starts a new lifecycle for each lesson and revision", () => {
		const page = render(<LessonVideo lesson={first} media={media} />);
		let video = page.container.querySelector("video") as HTMLVideoElement;
		video.currentTime = 12.4;
		fireEvent.play(video);
		fireEvent.play(video);
		expect(mocks.capture).toHaveBeenCalledOnce();
		expect(mocks.capture).toHaveBeenLastCalledWith("lesson_video_started", {
			lesson_id: first.id,
			position_seconds: 12,
		});

		page.rerender(<LessonVideo lesson={second} media={media} />);
		video = page.container.querySelector("video") as HTMLVideoElement;
		fireEvent.play(video);
		expect(mocks.capture).toHaveBeenCalledTimes(2);
		expect(mocks.capture).toHaveBeenLastCalledWith("lesson_video_started", {
			lesson_id: second.id,
			position_seconds: 0,
		});

		page.rerender(
			<LessonVideo
				lesson={{ ...second, contentVersion: second.contentVersion + 1 }}
				media={media}
			/>,
		);
		fireEvent.play(page.container.querySelector("video") as HTMLVideoElement);
		expect(mocks.capture).toHaveBeenCalledTimes(3);
	});

	it("allows a later consented play when the first play was not captured", () => {
		mocks.capture.mockReturnValueOnce(false);
		const page = render(<LessonVideo lesson={first} media={media} />);
		const video = page.container.querySelector("video") as HTMLVideoElement;
		fireEvent.play(video);
		fireEvent.play(video);
		fireEvent.play(video);
		expect(mocks.capture).toHaveBeenCalledTimes(2);
	});

	it("tracks completion on ended and never sends the protected media URL", () => {
		const page = render(
			<LessonVideo
				lesson={first}
				media={{ ...media, video: "/private.mp4?token=secret" }}
			/>,
		);
		const video = page.container.querySelector("video") as HTMLVideoElement;
		Object.defineProperty(video, "duration", { value: 80.2 });
		fireEvent.ended(video);
		expect(mocks.capture).toHaveBeenCalledWith("lesson_video_completed", {
			lesson_id: first.id,
			duration_seconds: 80,
		});
		expect(JSON.stringify(mocks.capture.mock.calls)).not.toContain("secret");
	});
});
