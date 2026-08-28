import { execFileSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.argv[2] ?? projectRoot);
const mediaRoot = resolve(projectRoot, "apps/web/public/media/tradingflow");
const privateMediaRoot = resolve(
	projectRoot,
	"apps/web/private-media/tradingflow",
);
const posterRoot = resolve(mediaRoot, "posters");
const captionRoot = resolve(mediaRoot, "captions");
const privateCaptionRoot = resolve(privateMediaRoot, "captions");

const lessons = [
	{
		target: "00-audited-boundary",
		preview: true,
		directory:
			"videos/tradingflow-academy/season-4/s4e01-start-a-new-question-with-the-audited-boundary",
		video: "renders/s4e01-video.mp4",
	},
	{
		target: "01-symbol-universe",
		preview: true,
		directory:
			"videos/tradingflow-academy/season-4/s4e02-choose-the-correct-symbol-universe",
		video: "renders/s4e02-video.mp4",
	},
	{
		target: "02-rank-symbols",
		preview: true,
		directory:
			"videos/tradingflow-academy/season-4/s4e03-rank-symbols-without-turning-rank-into-a-signal",
		video: "renders/s4e03-video.mp4",
	},
	{
		target: "03-symbol-drawer",
		directory:
			"videos/tradingflow-academy/season-4/s4e04-open-a-symbol-drawer-with-freshness-checks",
		video: "renders/s4e04-video.mp4",
	},
	{
		target: "04-rank-contracts",
		directory:
			"videos/tradingflow-academy/season-4/s4e05-rank-contracts-without-redefining-the-universe",
		video: "renders/s4e05-video.mp4",
	},
	{
		target: "05-option-trades",
		directory:
			"videos/tradingflow-academy/season-4/s4e06-validate-one-print-in-option-trades",
		video: "renders/s4e06-video.mp4",
	},
	{
		target: "06-session-flow-structure",
		directory:
			"videos/tradingflow-academy/season-4/s4e07-separate-session-flow-from-standing-structure",
		video: "renders/s4e07-video.mp4",
	},
	{
		target: "07-dex-dei-gex",
		directory:
			"videos/tradingflow-academy/season-4/s4e08-compare-dex-dei-and-gex-without-collapsing-horizons",
		video: "renders/s4e08-video.mp4",
	},
	{
		target: "08-cookbooks-packet",
		directory:
			"videos/tradingflow-academy/season-4/s4e09-build-a-repeatable-research-packet-in-cookbooks",
		video: "renders/s4e09-video.mp4",
	},
	{
		target: "09-market-recap",
		directory:
			"videos/tradingflow-academy/season-4/s4e10-turn-a-completed-packet-into-a-market-recap",
		video: "renders/s4e10-video.mp4",
	},
	{
		target: "10-recap-audit",
		directory:
			"videos/tradingflow-academy/season-4/s4e11-audit-a-market-recap-before-publishing",
		video: "renders/s4e11-video.mp4",
	},
];

const legacyTargets = [
	"00-getting-started",
	"01-why-tradingflow",
	"02-the-data-feed",
	"03-option-trades",
	"04-rank-contracts",
	"05-rank-symbols",
	"06-watchlists-and-filters",
	"07-options-and-flow-concepts",
	"08-greeks-and-gex",
	"09-option-chain-and-oi",
	"10-cookbooks",
];

function vttTime(seconds) {
	const safe = Math.max(0, seconds);
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const wholeSeconds = Math.floor(safe % 60);
	const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);
	return `${[hours, minutes, wholeSeconds]
		.map((part) => String(part).padStart(2, "0"))
		.join(":")}.${String(milliseconds).padStart(3, "0")}`;
}

function scriptCues(markdown) {
	const starts = [...markdown.matchAll(/^##\s+(?!Practice\b).+$/gm)];
	return starts
		.map((match, index) => {
			const end = starts[index + 1]?.index ?? markdown.length;
			const block = markdown.slice(match.index, end);
			const titleMatch = block.match(/\*\*([^*]+)\*\*/);
			const remaining = titleMatch
				? block.slice((titleMatch.index ?? 0) + titleMatch[0].length)
				: block;
			const description = remaining
				.split(/\n+/)
				.map((line) => line.trim())
				.find(
					(line) =>
						line &&
						!line.startsWith("#") &&
						!line.startsWith("**") &&
						line !== "---",
				);
			return [titleMatch?.[1], description].filter(Boolean).join(". ");
		})
		.filter(Boolean);
}

function writeCaptions(scriptPath, videoPath, outputPath) {
	const duration = Number(
		execFileSync(
			"ffprobe",
			[
				"-v",
				"error",
				"-show_entries",
				"format=duration",
				"-of",
				"default=noprint_wrappers=1:nokey=1",
				videoPath,
			],
			{ encoding: "utf8" },
		).trim(),
	);
	const cues = scriptCues(readFileSync(scriptPath, "utf8"));
	if (!Number.isFinite(duration) || cues.length === 0) {
		throw new Error(`Unable to derive captions for ${videoPath}`);
	}
	const cueDuration = duration / cues.length;
	const body = cues
		.map((cue, index) => {
			const start = vttTime(index * cueDuration);
			const end = vttTime(Math.min(duration, (index + 1) * cueDuration));
			return `${start} --> ${end}\n${cue}`;
		})
		.join("\n\n");
	writeFileSync(outputPath, `WEBVTT\n\n${body}\n`);
}

mkdirSync(posterRoot, { recursive: true });
mkdirSync(captionRoot, { recursive: true });
mkdirSync(privateMediaRoot, { recursive: true });
mkdirSync(privateCaptionRoot, { recursive: true });

for (const target of legacyTargets) {
	rmSync(resolve(mediaRoot, `${target}.mp4`), { force: true });
	rmSync(resolve(privateMediaRoot, `${target}.mp4`), { force: true });
	rmSync(resolve(captionRoot, `${target}.vtt`), { force: true });
	rmSync(resolve(privateCaptionRoot, `${target}.vtt`), { force: true });
	rmSync(resolve(posterRoot, `${target}.jpg`), { force: true });
}

for (const lesson of lessons) {
	const sourceDirectory = resolve(sourceRoot, lesson.directory);
	const sourceVideo = resolve(sourceDirectory, lesson.video);
	const targetVideoRoot = lesson.preview ? mediaRoot : privateMediaRoot;
	const targetCaptionRoot = lesson.preview ? captionRoot : privateCaptionRoot;
	const targetVideo = resolve(targetVideoRoot, `${lesson.target}.mp4`);
	if (!lesson.preview) {
		rmSync(resolve(mediaRoot, `${lesson.target}.mp4`), { force: true });
		rmSync(resolve(captionRoot, `${lesson.target}.vtt`), { force: true });
	}
	copyFileSync(sourceVideo, targetVideo);
	execFileSync("ffmpeg", [
		"-loglevel",
		"error",
		"-y",
		"-ss",
		"8",
		"-i",
		targetVideo,
		"-frames:v",
		"1",
		"-q:v",
		"2",
		resolve(posterRoot, `${lesson.target}.jpg`),
	]);
	writeCaptions(
		resolve(sourceDirectory, "SCRIPT.md"),
		targetVideo,
		resolve(targetCaptionRoot, `${lesson.target}.vtt`),
	);
}

mkdirSync(resolve(projectRoot, "apps/web/public/partners"), {
	recursive: true,
});
copyFileSync(
	resolve(
		sourceRoot,
		"../tradingflow-webapp-fullstack/src/assets/logo-mark.webp",
	),
	resolve(projectRoot, "apps/web/public/partners/tradingflow-mark.webp"),
);

console.log(
	`Imported ${lessons.length} academy videos: previews in ${mediaRoot}, paid lessons in ${privateMediaRoot}`,
);
