import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Readable } from "node:stream";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@tradely/env/server";

import { getLesson, type Lesson, type LessonMedia } from "@/content/course";
import { captureServerException } from "./analytics/posthog.server";

const MEDIA_URL_TTL_SECONDS = 30 * 60;

type MediaClaims = {
	lessonSlug: string;
	asset: MediaAsset;
	expiresAt: number;
};

type MediaAsset = "video" | "captions";

function joinUrl(base: string, path: string): string {
	return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function signingSecret(): string {
	if (!env.MEDIA_SIGNING_SECRET) {
		throw new Error("Private lesson media is not configured");
	}
	return env.MEDIA_SIGNING_SECRET;
}

function signClaims(claims: MediaClaims): string {
	const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
	const signature = createHmac("sha256", signingSecret())
		.update(payload)
		.digest("base64url");
	return `${payload}.${signature}`;
}

function verifyClaims(
	token: string,
	lessonSlug: string,
	asset: MediaAsset,
): MediaClaims | null {
	const parts = token.split(".");
	if (parts.length !== 2 || token.length > 2048) return null;
	const [payload, signature] = parts;
	if (!payload || !signature) return null;
	const expected = createHmac("sha256", signingSecret())
		.update(payload)
		.digest();
	const received = Buffer.from(signature, "base64url");
	if (
		expected.length !== received.length ||
		!timingSafeEqual(expected, received)
	)
		return null;
	try {
		const claims = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf8"),
		) as MediaClaims;
		if (
			claims.lessonSlug !== lessonSlug ||
			claims.asset !== asset ||
			!Number.isFinite(claims.expiresAt) ||
			claims.expiresAt <= Date.now()
		) {
			return null;
		}
		return claims;
	} catch {
		return null;
	}
}

function s3Client(): S3Client | null {
	if (!env.MEDIA_S3_BUCKET) return null;
	const hasAccessKey = Boolean(env.MEDIA_S3_ACCESS_KEY_ID);
	const hasSecret = Boolean(env.MEDIA_S3_SECRET_ACCESS_KEY);
	if (hasAccessKey !== hasSecret) {
		throw new Error("Media object-storage credentials are incomplete");
	}
	return new S3Client({
		region: env.MEDIA_S3_REGION,
		endpoint: env.MEDIA_S3_ENDPOINT,
		credentials:
			env.MEDIA_S3_ACCESS_KEY_ID && env.MEDIA_S3_SECRET_ACCESS_KEY
				? {
						accessKeyId: env.MEDIA_S3_ACCESS_KEY_ID,
						secretAccessKey: env.MEDIA_S3_SECRET_ACCESS_KEY,
					}
				: undefined,
	});
}

async function createObjectStorageUrl(
	lesson: Lesson,
	asset: MediaAsset,
): Promise<string> {
	const client = s3Client();
	if (!client || !env.MEDIA_S3_BUCKET)
		throw new Error("Media object storage is not configured");
	const suffix =
		asset === "video"
			? `${lesson.mediaKey}.mp4`
			: `captions/${lesson.mediaKey}.vtt`;
	const key = `${env.MEDIA_S3_KEY_PREFIX.replace(/\/$/, "")}/${suffix}`;
	return getSignedUrl(
		client,
		new GetObjectCommand({
			Bucket: env.MEDIA_S3_BUCKET,
			Key: key,
			ResponseContentType:
				asset === "video" ? "video/mp4" : "text/vtt; charset=utf-8",
		}),
		{ expiresIn: MEDIA_URL_TTL_SECONDS },
	);
}

export async function createLessonMedia(input: Lesson): Promise<LessonMedia> {
	const lesson = getLesson(input.slug);
	if (lesson?.mediaCurrent !== true)
		throw new Error("Lesson media is withheld");
	if (lesson.mediaDelivery === "public") {
		return {
			video: joinUrl(env.MEDIA_PUBLIC_BASE_URL, `${lesson.mediaKey}.mp4`),
			poster: lesson.poster,
			captions: joinUrl(
				env.MEDIA_PUBLIC_BASE_URL,
				`captions/${lesson.mediaKey}.vtt`,
			),
		};
	}
	if (env.MEDIA_S3_BUCKET) {
		const [video, captions] = await Promise.all([
			createObjectStorageUrl(lesson, "video"),
			createObjectStorageUrl(lesson, "captions"),
		]);
		return { video, poster: lesson.poster, captions };
	}
	const assetUrl = (asset: MediaAsset) => {
		const token = signClaims({
			lessonSlug: lesson.slug,
			asset,
			expiresAt: Date.now() + MEDIA_URL_TTL_SECONDS * 1000,
		});
		return `/api/lesson-media/${encodeURIComponent(lesson.slug)}/${asset}?token=${encodeURIComponent(token)}`;
	};
	return {
		video: assetUrl("video"),
		poster: lesson.poster,
		captions: assetUrl("captions"),
	};
}

function localMediaPath(lesson: Lesson, asset: MediaAsset): string {
	const root = env.PRIVATE_MEDIA_ROOT
		? resolve(env.PRIVATE_MEDIA_ROOT)
		: resolve(process.cwd(), "private-media/tradingflow");
	return asset === "video"
		? resolve(root, `${lesson.mediaKey}.mp4`)
		: resolve(root, "captions", `${lesson.mediaKey}.vtt`);
}

function byteRange(
	value: string | null,
	size: number,
): { start: number; end: number } | null {
	if (!value) return null;
	const match = /^bytes=(\d*)-(\d*)$/.exec(value);
	if (!match) return null;
	if (!match[1] && !match[2]) return null;
	let start: number;
	let end: number;
	if (!match[1]) {
		const suffix = Number(match[2]);
		if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
		start = Math.max(0, size - suffix);
		end = size - 1;
	} else {
		start = Number(match[1]);
		end = match[2] ? Number(match[2]) : size - 1;
	}
	if (
		!Number.isSafeInteger(start) ||
		!Number.isSafeInteger(end) ||
		start < 0 ||
		start >= size ||
		end < start
	)
		return null;
	end = Math.min(end, size - 1);
	return { start, end };
}

export async function serveLocalLessonMedia(input: {
	request: Request;
	lessonSlug: string;
	asset: string;
	headOnly?: boolean;
}): Promise<Response> {
	const lesson = getLesson(input.lessonSlug);
	if (lesson?.mediaCurrent !== true || lesson.mediaDelivery !== "signed")
		return new Response("Not found", { status: 404 });
	if (input.asset !== "video" && input.asset !== "captions") {
		return new Response("Not found", { status: 404 });
	}
	const token = new URL(input.request.url).searchParams.get("token");
	if (!token) return new Response("Not found", { status: 404 });
	let claims: MediaClaims | null = null;
	try {
		claims = verifyClaims(token, lesson.slug, input.asset);
	} catch (error) {
		await captureServerException(error, {
			source: "media",
			operation: "media_token_verify",
			lessonId: lesson.id,
		});
		return new Response("Media is not configured", { status: 503 });
	}
	if (!claims) {
		return new Response("Not found", { status: 404 });
	}
	const path = localMediaPath(lesson, input.asset);
	if (!existsSync(path))
		return new Response("Media not found", { status: 404 });
	const headers = new Headers({
		"Cache-Control": "no-store",
		"Content-Type":
			input.asset === "video" ? "video/mp4" : "text/vtt; charset=utf-8",
	});
	if (input.asset === "captions") {
		const body = readFileSync(path);
		headers.set("Content-Length", String(body.byteLength));
		return new Response(input.headOnly ? null : body, { status: 200, headers });
	}
	const size = statSync(path).size;
	headers.set("Accept-Ranges", "bytes");
	const requestedRange = input.request.headers.get("range");
	const range = byteRange(requestedRange, size);
	if (requestedRange && !range) {
		headers.set("Content-Range", `bytes */${size}`);
		return new Response(null, { status: 416, headers });
	}
	if (!range) {
		headers.set("Content-Length", String(size));
		const stream = input.headOnly
			? null
			: Readable.toWeb(createReadStream(path));
		return new Response(stream as BodyInit | null, { status: 200, headers });
	}
	const length = range.end - range.start + 1;
	headers.set("Content-Length", String(length));
	headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
	const stream = input.headOnly
		? null
		: Readable.toWeb(
				createReadStream(path, { start: range.start, end: range.end }),
			);
	return new Response(stream as BodyInit | null, { status: 206, headers });
}
