import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
	current: true,
	env: {
		MEDIA_SIGNING_SECRET: "test-only-signing-key-with-more-than-32-characters",
		PRIVATE_MEDIA_ROOT: "",
		MEDIA_PUBLIC_BASE_URL: "/media/tradingflow",
		MEDIA_S3_BUCKET: undefined,
	},
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/env/server", () => ({ env: mocks.env }));
vi.mock("./analytics/posthog.server", () => ({
	captureServerException: vi.fn(),
}));
vi.mock("@/content/course", async (original) => {
	const actual = await original<typeof import("@/content/course")>();
	return {
		...actual,
		getLesson: (slug: string) => {
			const lesson = actual.getLesson(slug);
			return lesson && { ...lesson, mediaCurrent: mocks.current };
		},
	};
});

import { getLesson } from "@/content/course";
import { createLessonMedia, serveLocalLessonMedia } from "./media.server";

const root = mkdtempSync(join(tmpdir(), "tradely-media-test-"));
mocks.env.PRIVATE_MEDIA_ROOT = root;
const lesson = getLesson("rank-contracts");
if (!lesson) throw new Error("Missing fixture lesson");
mkdirSync(join(root, "captions"));
writeFileSync(join(root, `${lesson.mediaKey}.mp4`), "0123456789");
writeFileSync(join(root, "captions", `${lesson.mediaKey}.vtt`), "WEBVTT\n");
afterAll(() => rmSync(root, { recursive: true, force: true }));
afterEach(() => vi.useRealTimers());
beforeEach(() => {
	mocks.current = true;
});
const request = (
	url: string,
	asset = "video",
	headers?: Record<string, string>,
	headOnly = false,
) =>
	serveLocalLessonMedia({
		request: new Request(new URL(url, "http://localhost"), { headers }),
		lessonSlug: lesson.slug,
		asset,
		headOnly,
	});
describe("guest media delivery", () => {
	it("serves signed guest video ranges, HEAD, and captions without an identity", async () => {
		const media = await createLessonMedia(lesson);
		const range = await request(media.video, "video", { Range: "bytes=2-4" });
		expect(range.status).toBe(206);
		expect(await range.text()).toBe("234");
		expect(range.headers.get("content-range")).toBe("bytes 2-4/10");
		expect(range.headers.get("vary")).toBeNull();
		expect(
			await (await request(media.video, "video", { Range: "bytes=-3" })).text(),
		).toBe("789");
		expect(
			(await request(media.video, "video", { Range: "bytes=10-" })).status,
		).toBe(416);
		const head = await request(media.video, "video", undefined, true);
		expect(head.headers.get("content-length")).toBe("10");
		expect(await head.text()).toBe("");
		expect(await (await request(media.captions, "captions")).text()).toBe(
			"WEBVTT\n",
		);
	});
	it("binds tokens to the asset and expiry", async () => {
		const media = await createLessonMedia(lesson);
		expect((await request(media.video, "captions")).status).toBe(404);
		expect((await request(media.video, "../secret")).status).toBe(404);
		vi.useFakeTimers();
		vi.setSystemTime(Date.now() + 31 * 60_000);
		expect((await request(media.video)).status).toBe(404);
	});
	it("rejects withheld media even with an existing valid URL", async () => {
		const media = await createLessonMedia(lesson);
		mocks.current = false;
		await expect(createLessonMedia(lesson)).rejects.toThrow(/withheld/);
		expect((await request(media.video)).status).toBe(404);
	});
});
