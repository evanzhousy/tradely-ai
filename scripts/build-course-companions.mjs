import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Reproducible local replacements for the three misleading legacy video examples.
// Generated media stays outside public/ and is never uploaded by this script.
const root = resolve(import.meta.dirname, "..");
const uiRequire = createRequire(join(root, "packages/ui/package.json"));
const fontRoot = dirname(
	uiRequire.resolve("@fontsource-variable/inter/package.json"),
);
const out = join(root, "videos/course-v2-companions");
const panels = [
	{
		id: "premium-calculation",
		lessonId: "validate-option-print",
		title: "One price. Three different quantities.",
		scenes: [
			{
				title: "Read the quoted unit",
				lead: "The quote is per share; the contract supplies the multiplier.",
				lines: [
					["Option quote", "$2.05 / share"],
					["Stated multiplier", "100 shares / contract"],
					["Executed quantity", "500 contracts"],
				],
				caption:
					"Synthetic execution. A quoted option price is not the total execution premium.",
			},
			{
				title: "Let the units cancel",
				lead: "$2.05 / share × 100 shares / contract × 500 contracts",
				lines: [
					["Premium per contract", "$205"],
					["Total execution premium", "$102,500"],
				],
				caption:
					"Price per share × the stated multiplier × contract count gives total premium.",
			},
			{
				title: "Keep interpretation separate",
				lead: "$102,500 is the observed execution amount.",
				lines: [
					["Known", "Price, quantity, multiplier"],
					["Not established", "Opening intent or full strategy"],
					["Different quantity", "Underlying notional"],
				],
				caption:
					"Premium is dollars exchanged, not conviction, ownership, or a price forecast.",
			},
		],
	},
	{
		id: "research-question",
		lessonId: "audited-boundary",
		title: "A research question you can inspect.",
		scenes: [
			{
				title: "Start from this question",
				lead: "Where did call volume concentrate in the observed eligible contracts?",
				lines: [
					["Underlying and type", "ALFA calls"],
					["Expiry", "October 16"],
					["Session", "September 3 closing snapshot"],
				],
				caption:
					"This example is self-contained. No prior season or organizational role chart is required.",
			},
			{
				title: "Name the evidence contract",
				lead: "Another reader needs the same inputs and comparison rule.",
				lines: [
					["Source", "Synthetic tape-A"],
					["Quantity", "Contracts traded"],
					["Coverage", "Report missing series explicitly"],
				],
				caption:
					"Declare source, units, session cutoff and coverage before reading the result.",
			},
			{
				title: "Allow evidence to change your answer",
				lead: "A corrected print can test the same question. Switching the universe changes it.",
				lines: [
					["Retain", "Original question and source record"],
					["Reconsider", "Required coverage fails"],
					["Record separately", "A new instrument or method"],
				],
				caption:
					"Preserve history. A specific forecast would require its own horizon, outcome and evaluation.",
			},
		],
	},
	{
		id: "recap-audit",
		lessonId: "audit-market-recap",
		title: "A chart that carries its evidence.",
		scenes: [
			{
				title: "Inspect the actual source",
				lead: "ALFA calls · October 16 expiry · September 3 · synthetic tape-A",
				lines: [
					["R1 · strike 100", "300 contracts"],
					["R2 · strike 105", "200 contracts"],
					["R3 · strike 110", "Missing"],
				],
				caption:
					"The measured quantity is contract count. Missing is not an observed zero.",
			},
			{
				title: "Label the comparison",
				lead: "Observed session volume by strike · contracts",
				chart: true,
				lines: [],
				caption:
					"Zero-based count axis; strike labels; tape-A; September 3; October 16 calls. R3 remains missing.",
			},
			{
				title: "Repair the headline",
				lead: "500 contracts observed across the two covered strikes.",
				lines: [
					["Coverage caveat", "Strike 110 is missing"],
					["Supported", "An observed subtotal"],
					["Not established", "All activity or new positions"],
				],
				caption:
					"Keep the defensible subtotal and its coverage limit together. This is not a forecast.",
			},
		],
	},
];

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
const clock = (second) => `00:00:${String(second).padStart(2, "0")}.000`;
const manifest = [];
for (const video of panels) {
	const directory = join(out, video.id);
	mkdirSync(directory, { recursive: true });
	copyFileSync(
		join(fontRoot, "files/inter-latin-wght-normal.woff2"),
		join(directory, "inter.woff2"),
	);
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920, height=1080"><title>${escapeHtml(video.title)}</title><style>
@font-face{font-family:Inter;src:url('./inter.woff2')}*{box-sizing:border-box}body{margin:0;background:#faf9f4;color:#161616;font-family:Inter,Arial,sans-serif}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.clip{position:absolute;inset:0;padding:72px;display:flex;flex-direction:column;gap:30px;background:#faf9f4}.brand{display:flex;justify-content:space-between;font-size:25px;color:#4a4a4a}h1{font-size:66px;line-height:1.1;letter-spacing:-2px;max-width:1720px;margin:0}.lead{font-size:34px;line-height:1.35;margin:0;max-width:1720px}.rows{display:flex;flex-direction:column;gap:18px;margin:auto 0}.row{display:grid;grid-template-columns:550px 1fr;gap:30px;padding:22px 30px;border-bottom:2px solid #a7a59a}.label{font-size:30px;color:#444}.value{font-size:42px;font-weight:650}.caption{font-size:28px;line-height:1.4;background:#ffcf00;color:#161616;padding:24px 30px;margin:0}.chart{display:flex;flex-direction:column;gap:30px;margin:auto 0;padding:20px 0}.barrow{display:grid;grid-template-columns:180px 1fr 200px;align-items:center;gap:30px;font-size:32px}.track{height:70px;background:#e3e1d9}.bar{height:70px;background:#303030}.axis{display:grid;grid-template-columns:1fr 1fr 1fr;margin-left:210px;margin-right:230px;font-size:27px;color:#444}.axis span:nth-child(2){text-align:center}.axis span:nth-child(3){text-align:right}.source{font-size:26px;color:#444}
</style></head><body><div id="root" data-composition-id="${video.id}" data-no-timeline data-width="1920" data-height="1080" data-duration="45">${video.scenes.map((scene, index) => `<section id="scene-${index}" class="clip" data-track-index="0" data-start="${index * 15}" data-duration="15"><div class="brand"><span>Tradely · visual companion</span><span>${index + 1} / 3 · Synthetic teaching example</span></div><h1>${escapeHtml(scene.title)}</h1><p class="lead">${escapeHtml(scene.lead)}</p>${scene.chart ? `<div class="chart"><div class="axis"><span>0</span><span>150</span><span>300 contracts</span></div><div class="barrow"><span>Strike 100</span><div class="track"><div class="bar" style="width:100%"></div></div><span>300</span></div><div class="barrow"><span>Strike 105</span><div class="track"><div class="bar" style="width:66.6667%"></div></div><span>200</span></div><div class="barrow"><span>Strike 110</span><div>Missing source observation</div><span>—</span></div><p class="source">Source: synthetic tape-A · 2026-09-03 · ALFA October 16 calls · R1/R2 observed, R3 missing</p></div>` : `<div class="rows">${scene.lines.map(([label, value]) => `<div class="row"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`).join("")}</div>`}<p class="caption">${escapeHtml(scene.caption)}</p></section>`).join("")}</div></body></html>`;
	writeFileSync(join(directory, "index.html"), html);
	writeFileSync(
		join(directory, "captions.vtt"),
		`WEBVTT\n\n${video.scenes.map((scene, index) => `${clock(index * 15)} --> ${clock((index + 1) * 15)}\n${scene.title}. ${scene.caption}\n`).join("\n")}`,
	);
	writeFileSync(
		join(directory, "hyperframes.json"),
		JSON.stringify(
			{
				schemaVersion: 1,
				projectId: video.id,
				composition: "index.html",
				width: 1920,
				height: 1080,
				fps: 30,
				duration: 45,
			},
			null,
			2,
		),
	);
	writeFileSync(
		join(directory, "package.json"),
		JSON.stringify(
			{
				name: `tradely-${video.id}`,
				private: true,
				type: "module",
				scripts: {
					check: "npx --yes hyperframes@0.8.31 check",
					render:
						"npx --yes hyperframes@0.8.31 render --quality high --output renders/companion.mp4",
				},
			},
			null,
			2,
		),
	);
	writeFileSync(
		join(directory, "BRIEF.md"),
		`# ${video.title}\n\nSpecific replacement for a misleading legacy course example, authorized by the course-update plan.\n\nWorkflow: general-video. Format: 1920×1080, 45 seconds, three readable 15-second panels. English captions; silent visual companion. Full English/Chinese teaching remains in the interactive lesson. No paid generation, cloud rendering, upload, or production activation.\n`,
	);
	writeFileSync(
		join(directory, "SCRIPT.md"),
		video.scenes
			.map(
				(scene, index) =>
					`## ${index * 15}–${(index + 1) * 15}s · ${scene.title}\n\n${scene.lead}\n\n${scene.lines.map(([a, b]) => `${a}: ${b}`).join("\n")}\n\n${scene.caption}`,
			)
			.join("\n\n"),
	);
	manifest.push({
		lessonId: video.lessonId,
		project: `videos/course-v2-companions/${video.id}`,
		source: `videos/course-v2-companions/${video.id}/renders/companion.mp4`,
		captions: `videos/course-v2-companions/${video.id}/captions.vtt`,
		proposedPrivateKey: `tradingflow-concepts/course-v2/${video.id}.mp4`,
		status: "prepared-local-not-published",
	});
}
writeFileSync(
	join(out, "manifest.json"),
	JSON.stringify(
		{
			note: "Review and publish explicitly; this builder performs no network writes.",
			assets: manifest,
		},
		null,
		2,
	),
);
console.log(`Prepared ${panels.length} local companion projects in ${out}`);
