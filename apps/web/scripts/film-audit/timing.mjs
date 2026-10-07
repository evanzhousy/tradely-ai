// One page of the film audit (run by film-audit.sh in ego-browser). Audits a film's timing and
// copy from its timeline: every headline's hold, the question line, the claim and its second
// line, headline length and figures, the hero lock's share of the runtime (label "hero-lock"),
// the runtime, class names, and headlines stacked on one another. Warns when a headline
// states a figure the stage doesn't show yet ("made, not stated").
// env: SPACE, LESSON, SIZE, LOCALE, PORT
const task = await taskSpace(Number(env.SPACE));
const page = task.page("p1");
const [w, h, dpr] = env.SIZE.replace("m", "").split("x").map(Number);
await page.cdp("Emulation.setDeviceMetricsOverride", {
	width: w,
	height: h,
	deviceScaleFactor: dpr,
	mobile: env.SIZE.endsWith("m"),
});
await page.goto(`http://localhost:${env.PORT}/learn/${env.LESSON}`);
await page.evaluate((loc) => {
	localStorage.setItem("tradely.locale", loc);
	// biome-ignore lint/suspicious/noDocumentCookie: the page sets the app's locale cookie, as its switcher does
	document.cookie = `tradely.locale=${loc}; Path=/; Max-Age=31536000; SameSite=Lax`;
}, env.LOCALE);
await page.reload();
await page.waitForSelector("loc=css:.wt-film-svg", {
	state: "visible",
	timeout: 90000,
});
await page.waitForTimeout(1200);
// Pause through the player's own button, clicked in the page: a layout's overlay can sit
// over it on a phone, and the player would otherwise keep driving the timeline.
await page.evaluate(() => document.querySelector('[data-nav="play"]').click());
const out = await page.evaluate(() => {
	const tl = window.__tradelyFilm;
	tl.pause();
	const svg = document.querySelector(".wt-film-svg");
	const duration = tl.duration();
	const tweens = tl.getChildren(true, true, false);
	const lines = [...svg.querySelectorAll("[data-f]")].filter((el) => {
		const n = el.getAttribute("data-f");
		return (
			/-head$/.test(n) || ["q-big", "q-line", "z-big", "z-sub"].includes(n)
		);
	});
	const textOf = (el) =>
		el.querySelectorAll("tspan").length
			? [...el.querySelectorAll("tspan")]
					.map((t) => t.textContent.trim())
					.join(" ")
			: el.textContent.trim();
	const events = (el) => {
		const ev = [];
		for (const tw of tweens) {
			if (!tw.targets().includes(el)) continue;
			const v = tw.vars;
			if (!("opacity" in v)) continue;
			const s = Math.round(tw.startTime() * 100) / 100;
			// A hide's third value: when it is gone.
			if (v.opacity === 0) ev.push(["hide", s, s + tw.duration()]);
			else if (Number(v.opacity) >= 0.9) ev.push(["show", s]);
		}
		return ev.sort((a, b) => a[1] - b[1]);
	};
	const rows = [];
	for (const el of lines) {
		const name = el.getAttribute("data-f");
		const text = textOf(el);
		const ev = events(el);
		// Skip the hidden-at-start set (time 0) and pair each show with the next hide.
		for (const [, s] of ev.filter(([k, s]) => k === "show" && s > 0.05)) {
			const next = ev.find(([k, t]) => k === "hide" && t > s);
			rows.push({
				name,
				text,
				show: s,
				hold: Math.round(((next ? next[1] : duration) - s) * 100) / 100,
			});
		}
	}
	// Made, not stated: each figure a headline names should already be on the stage, settled,
	// 0.3 s after the headline starts to show.
	const alpha = (el) => {
		let a = 1;
		for (let e = el; e && e !== svg; e = e.parentElement)
			a *= Number(getComputedStyle(e).opacity);
		// Folded shut is hidden too: a flip squashes its marks to scaleY 0 at full opacity.
		const m = el.getCTM?.();
		if (m && (Math.hypot(m.a, m.b) < 0.02 || Math.hypot(m.c, m.d) < 0.02))
			return 0;
		return a;
	};
	const norm = (t) => t.replace(/−/g, "-").replace(/\s+/g, " ");
	const stated = [];
	for (const r of rows) {
		if (!/-head$/.test(r.name)) continue;
		const figs =
			norm(r.text)
				.replace(/\d+月\d+日/g, " ")
				.replace(
					/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+/g,
					" ",
				)
				// Money, percentages and cents, and any other number standing as a word ("−4",
				// "50,000,000"); not digits inside a name ("IV30") or a time ("10:05").
				.match(
					/[-+±]?\$[\d,.]*\d|\d[\d,.]*[%¢]|(?<![\w$.,:])[-+±]?\d[\d,.]*\d(?![\w%¢:])|(?<![\w$.,:])[-+±]?\d(?![\w%¢.,:])/g,
				) || [];
		if (!figs.length) continue;
		tl.seek(r.show + 0.3, false);
		const stage = [...svg.querySelectorAll("text")]
			.filter((t) => {
				const n = t.closest("[data-f]")?.getAttribute("data-f") || "";
				return (
					alpha(t) > 0.6 &&
					!/-head$|^q-|^z-/.test(n) &&
					!t.closest('[data-f="carry-layer"]')
				);
			})
			.map((t) => norm(t.textContent));
		for (const f of figs)
			if (!stage.some((t) => t.includes(f.replace(/^[-+±]/, ""))))
				stated.push(
					`${r.name} at ${r.show.toFixed(2)} states ${f} before the stage shows it`,
				);
	}
	// Two headlines never share the stage where they overlap: one that comes up while another
	// is still on, or still fading out, in the same place.
	const spans = [];
	for (const el of lines) {
		const name = el.getAttribute("data-f");
		if (!/-head$/.test(name)) continue;
		const ev = events(el);
		const box = el.getBBox();
		for (const [, s] of ev.filter(([k, s]) => k === "show" && s > 0.05)) {
			const next = ev.find(([k, t]) => k === "hide" && t > s);
			spans.push({ name, from: s, to: next ? next[2] : duration, box });
		}
	}
	const meet = (a, b) =>
		a.x < b.x + b.width - 2 &&
		b.x < a.x + a.width - 2 &&
		a.y < b.y + b.height - 2 &&
		b.y < a.y + a.height - 2;
	const stacked = [];
	for (const [i, a] of spans.entries())
		for (const b of spans.slice(i + 1)) {
			const both = Math.min(a.to, b.to) - Math.max(a.from, b.from);
			if (a.name !== b.name && both > 0.02 && meet(a.box, b.box))
				stacked.push(
					`${a.name} and ${b.name} share their place for ${both.toFixed(2)} s at ${Math.max(a.from, b.from).toFixed(2)}`,
				);
		}
	// Every sentence on the stage, by role rather than name: when it is actually visible
	// (its own opacity and its groups'), sampled every 0.1 s.
	const words = (t) =>
		t.split(/\s+/).filter((x) => /[A-Za-z0-9$]/.test(x)).length;
	const cjk = (t) => (t.match(/[㐀-鿿]/g) || []).length;
	// Figures set as a sentence ("50¢ more to buy") are prose too: a number-styled text with
	// two or more words of letters.
	const lettered = (t) =>
		t.split(/\s+/).filter((x) => /[A-Za-z]{2,}/.test(x)).length;
	const prose = [...svg.querySelectorAll("text[data-f]")].filter((el) => {
		const cls = el.getAttribute("class") || "";
		return (
			(/\bwt-film-type\b/.test(cls) ||
				(/\bwt-film-num\b/.test(cls) && lettered(textOf(el)) >= 2)) &&
			!el.closest('[data-f="end"], [data-f="title-group"]') &&
			el.getAttribute("data-f") !== "title-sub"
		);
	});
	const seen = new Map(prose.map((el) => [el, []]));
	for (let t = 0; t <= duration + 0.001; t += 0.1) {
		tl.seek(t, false);
		for (const el of prose) {
			const runs = seen.get(el);
			const on = alpha(el) >= 0.6;
			const last = runs.at(-1);
			if (on && last && last.to === null) continue;
			if (on) runs.push({ from: t, to: null });
			else if (last && last.to === null) last.to = t;
		}
	}
	// The kit's type scale, from the frame's width: a sentence is set at body size or larger
	// (halfway between small and body), so labels and tags aren't held as sentences.
	const width = svg.viewBox.baseVal.width || svg.getBoundingClientRect().width;
	const narrow = width < 520;
	const clamp = (lo, v, hi) => Math.min(hi, Math.max(lo, v));
	const bodySize = clamp(narrow ? 13 : 12, width * 0.018, 17);
	const smallSize = clamp(narrow ? 11 : 10, width * 0.013, 13);
	const floor = (bodySize + smallSize) / 2;
	const typeHead = clamp(narrow ? 16 : 15, width * 0.027, 25);
	const sentences = [];
	for (const [el, runs] of seen) {
		const text = textOf(el);
		const size = Number.parseFloat(getComputedStyle(el).fontSize) || 0;
		const long = (words(text) >= 4 || cjk(text) >= 8) && size >= floor;
		for (const r of runs)
			if (r.from > 0.05)
				sentences.push({
					name: el.getAttribute("data-f"),
					text,
					size,
					kind: /\bwt-film-type\b/.test(el.getAttribute("class") || "")
						? "type"
						: "num",
					long,
					top: el.getBBox().y,
					from: Math.round(r.from * 10) / 10,
					hold: Math.round(((r.to ?? duration) - r.from) * 10) / 10,
				});
	}
	// The claim: the last named claim to come up (z-big, c-big, claim-big…), or failing
	// that the last of the largest sentences of three words or more.
	const largest = Math.max(0, ...sentences.map((x) => x.size));
	const last = (xs) => xs.sort((a, b) => b.from - a.from)[0];
	const claimRun =
		last(
			sentences.filter(
				(x) => /^z-big$|^(c|claim|local)-big$/.test(x.name) && x.from > 0,
			),
		) ??
		last(
			sentences.filter(
				(x) =>
					x.size >= largest * 0.85 &&
					!/^q-/.test(x.name) &&
					(words(x.text) >= 3 || cjk(x.text) >= 6),
			),
		);
	// Beats: headlines, and any other sentence set at headline size or larger, the
	// question and the claim aside.
	const heads = sentences.filter((x) => /-head$/.test(x.name));
	const headSize = heads.length
		? heads.map((x) => x.size).sort((a, b) => a - b)[
				Math.floor(heads.length / 2)
			]
		: largest;
	// A beat is one headline: an answer half set under it (a second line) belongs to its beat.
	const headTop = Math.min(...heads.map((x) => x.top));
	const beatNames = new Set(
		heads.filter((x) => x.top <= headTop + 4).map((x) => x.name),
	);
	for (const x of sentences)
		if (
			!/-head$|^q-/.test(x.name) &&
			x !== claimRun &&
			x.long &&
			x.size >= headSize * 0.9 &&
			!(claimRun && x.from >= claimRun.from)
		)
			beatNames.add(x.name);
	// The hero's lock: exactly one glowing bracket, at full strength within 0.5 s of the
	// hero-lock label and held there at least 1 s.
	const glows = [...svg.querySelectorAll(".wt-film-lock[data-glow]")];
	const hero = tl.labels["hero-lock"];
	const glow = { count: glows.length, on: null, held: 0 };
	if (hero !== undefined && glows.length) {
		const strong = (t) => {
			tl.seek(t, false);
			return glows.some((g) => alpha(g) >= 0.8);
		};
		for (let t = hero; t <= hero + 0.5; t += 0.05)
			if (strong(t)) {
				glow.on = t;
				break;
			}
		if (glow.on !== null)
			for (let t = glow.on; t <= duration; t += 0.05) {
				if (!strong(t)) break;
				glow.held = t - glow.on;
			}
	}
	// Still spans: from the question to the last label, any stretch over 2 s in which no tween
	// runs (the backdrop's slow drift aside, and sets, which are cuts rather than motion).
	const runs = tweens
		.filter((tw) => tw.duration() > 0.01 && tw.duration() < 10)
		.map((tw) => [tw.startTime(), tw.startTime() + tw.duration()])
		.sort((a, b) => a[0] - b[0]);
	// The question shot and the closing claim are read standing still; measure between them.
	const labels = Object.values(tl.labels).sort((a, b) => a - b);
	const from =
		labels.find((t) => t > (tl.labels.question ?? 2)) ??
		tl.labels.question ??
		2;
	const claim = [...svg.querySelectorAll("[data-f]")].find((el) =>
		/^(z|c|claim)-big$/.test(el.getAttribute("data-f")),
	);
	const claimAt = claim
		? Math.min(
				...tweens
					.filter((tw) => tw.targets().includes(claim) && tw.startTime() > 0.05)
					.map((tw) => tw.startTime()),
			)
		: Number.POSITIVE_INFINITY;
	const to = Math.min(labels.at(-1) ?? duration, claimAt);
	const still = [];
	let reach = from;
	for (const [a, b] of runs) {
		if (b <= from) continue;
		if (a >= to) break;
		if (a - reach > 2) still.push([reach, a - reach]);
		reach = Math.max(reach, b);
	}
	if (to - reach > 2) still.push([reach, to - reach]);
	const bad = new Set();
	for (let t = 0; t <= duration; t += 1) {
		tl.seek(t, false);
		for (const el of svg.querySelectorAll("[class]"))
			for (const c of (el.getAttribute("class") || "").split(/\s+/))
				if (/wt-.+wt-/.test(c)) bad.add(c);
	}
	return {
		duration,
		headSize: typeHead,
		heroLock: tl.labels["hero-lock"],
		glow,
		sentences,
		claim: claimRun ?? null,
		beats: [...beatNames],
		still,
		rows,
		badClasses: [...bad],
		stacked,
		stated,
	};
});
const zh = env.LOCALE === "zh";
const words = (t) =>
	t.split(/\s+/).filter((x) => /[A-Za-z0-9$]/.test(x)).length;
const cjk = (t) => (t.match(/[㐀-鿿]/g) || []).length;
// A date is one figure: "Oct 18", "10月18日". Its stand-in can't occur in copy ("Delta" has a D).
const figures = (t) =>
	(
		t
			.replace(/\d+月\d+日/g, "\uE000")
			.replace(
				/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+/g,
				"\uE000",
			)
			.match(/[−+]?[$¥]?\d[\d,.:]*%?|\uE000/g) || []
	).length;
const fails = [];
for (const r of out.rows) {
	const head = /-head$/.test(r.name);
	if ((head || r.name === "q-line" || r.name === "q-big") && r.hold < 3.5)
		fails.push(`hold ${r.name} ${r.hold}s < 3.5`);
	if (r.name === "z-big" && r.hold < 4) fails.push(`hold z-big ${r.hold}s < 4`);
	if (
		r.name === "z-sub" &&
		(zh ? cjk(r.text) > 22 : words(r.text) > 9) &&
		r.hold < 4.5
	)
		fails.push(
			`z-sub ${zh ? `${cjk(r.text)} chars` : `${words(r.text)} words`} held ${r.hold}s (≤${zh ? 22 : 9} or 4.5 s)`,
		);
	if (head && (zh ? cjk(r.text) > 18 : words(r.text) > 8))
		fails.push(
			`long ${r.name}: ${zh ? `${cjk(r.text)} chars` : `${words(r.text)} words`} "${r.text}"`,
		);
	if (head && figures(r.text) > 2)
		fails.push(`figures ${r.name}: ${figures(r.text)} "${r.text}"`);
}
const play = out.duration;
if (play > 45.5) fails.push(`runtime ${play.toFixed(1)}s > 45.5`);
if (out.heroLock === undefined) fails.push("no hero-lock label");
else {
	const pct = out.heroLock / play;
	if (pct < 0.55 || pct > 0.65)
		fails.push(
			`hero-lock at ${(pct * 100).toFixed(1)} % (${out.heroLock.toFixed(2)} s)`,
		);
}
// Sentences the name rules don't cover are held to be read too; the claim is found by role.
const named = /-head$|^(q-line|q-big|z-big|z-sub)$/;
for (const x of out.sentences)
	if (
		x.long &&
		!named.test(x.name) &&
		!(out.claim && x.name === out.claim.name && x.from === out.claim.from) &&
		x.hold < 3.5
	)
		fails.push(`hold ${x.name} ${x.hold}s < 3.5: "${x.text.slice(0, 48)}"`);
// A sentence set at headline size is held to a headline's length, whatever its name.
const sized = (x) => x.size >= out.headSize * 0.9;
const isClaim = (x) =>
	out.claim && x.name === out.claim.name && x.from === out.claim.from;
const told = new Set();
for (const x of out.sentences) {
	if (
		!x.long ||
		x.kind !== "type" ||
		!sized(x) ||
		/-head$|^q-|^z-big$/.test(x.name) ||
		isClaim(x)
	)
		continue;
	if (told.has(x.name)) continue;
	told.add(x.name);
	if (zh ? cjk(x.text) > 18 : words(x.text) > 8)
		fails.push(
			`long ${x.name} at headline size: ${zh ? `${cjk(x.text)} chars` : `${words(x.text)} words`} "${x.text}"`,
		);
	if (figures(x.text) > 2)
		fails.push(`figures ${x.name}: ${figures(x.text)} "${x.text}"`);
}
// The claim's second line, found by role: what comes up with it, under it.
if (out.claim)
	for (const x of out.sentences)
		if (
			x.name !== out.claim.name &&
			x.name !== "z-sub" &&
			x.from >= out.claim.from &&
			x.from <= out.claim.from + 1 &&
			(zh ? cjk(x.text) > 22 : words(x.text) > 9) &&
			x.hold < 4.5
		)
			fails.push(
				`claim line ${x.name}: ${zh ? `${cjk(x.text)} chars` : `${words(x.text)} words`} held ${x.hold}s (≤${zh ? 22 : 9} or 4.5 s)`,
			);
if (!out.claim) fails.push("no claim");
else if (!named.test(out.claim.name) && out.claim.hold < 4)
	fails.push(
		`hold claim ${out.claim.name} ${out.claim.hold}s < 4: "${out.claim.text.slice(0, 48)}"`,
	);
if (out.beats.length > 7)
	fails.push(`beats: ${out.beats.length} (${out.beats.join(", ")}) > 7`);
if (out.glow.count !== 1)
	fails.push(`glow: ${out.glow.count} glowing locks (one, on the hero)`);
else if (out.heroLock !== undefined && out.glow.on === null)
	fails.push(
		"glow: the glowing lock isn't at full strength within 0.5 s of hero-lock",
	);
else if (out.heroLock !== undefined && out.glow.held < 1)
	fails.push(
		`glow: the hero lock holds ${out.glow.held.toFixed(2)} s at full strength (< 1 s)`,
	);
for (const c of out.badClasses) fails.push(`class "${c}"`);
for (const s of out.stacked) fails.push(`stacked: ${s}`);
console.log(
	JSON.stringify({
		lesson: env.LESSON,
		config: `${env.SIZE}:${env.LOCALE}`,
		runtime: Math.round(play * 10) / 10,
		heroLock: out.heroLock,
		fails,
		warnings: [
			...out.stated,
			...out.still.map(
				([at, length]) => `still ${length.toFixed(1)} s at ${at.toFixed(1)}`,
			),
		],
		rows: out.rows.map(
			(r) => `${r.show.toFixed(2)} ${r.hold.toFixed(2)} ${r.name} ${r.text}`,
		),
	}),
);
