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
		return /-head$/.test(n) || ["q-line", "z-big", "z-sub"].includes(n);
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
				.match(/[-+]?\$[\d,.]+\d|\d[\d,.]*%/g) || [];
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
			if (!stage.some((t) => t.includes(f.replace(/^[-+]/, ""))))
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
	const bad = new Set();
	for (let t = 0; t <= duration; t += 1) {
		tl.seek(t, false);
		for (const el of svg.querySelectorAll("[class]"))
			for (const c of (el.getAttribute("class") || "").split(/\s+/))
				if (/wt-.+wt-/.test(c)) bad.add(c);
	}
	return {
		duration,
		heroLock: tl.labels["hero-lock"],
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
	if ((head || r.name === "q-line") && r.hold < 3.5)
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
for (const c of out.badClasses) fails.push(`class "${c}"`);
for (const s of out.stacked) fails.push(`stacked: ${s}`);
console.log(
	JSON.stringify({
		lesson: env.LESSON,
		config: `${env.SIZE}:${env.LOCALE}`,
		runtime: Math.round(play * 10) / 10,
		heroLock: out.heroLock,
		fails,
		warnings: out.stated,
		rows: out.rows.map(
			(r) => `${r.show.toFixed(2)} ${r.hold.toFixed(2)} ${r.name} ${r.text}`,
		),
	}),
);
