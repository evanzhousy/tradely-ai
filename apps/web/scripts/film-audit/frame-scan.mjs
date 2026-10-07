// One page of the film audit (run by film-audit.sh in ego-browser): seeks a lesson film to each
// time, screenshots the frame and checks it. Configured by env:
// SPACE, LESSON, OUT, PREFIX, TIMES ("a,b,c" or "start:end:step"), SIZE ("1440x900x1" or
// "390x844x2m"), LOCALE, PORT
//   spills     text past the frame (outside the camera's world group)
//   overlaps   settled texts whose glyph boxes cross (a text held at a scale is settled)
//   crossings  settled text struck by a visible stroked line (not grid, axes or masks)
//   edges      text or lock brackets within 12 px of a phone frame's sides (6 px wider)

const task = await taskSpace(Number(env.SPACE));
const page = task.page("p1");
const [w, h, dpr] = env.SIZE.replace("m", "").split("x").map(Number);
const mobile = env.SIZE.endsWith("m");
let times;
if (env.TIMES.includes(":")) {
	const [a, b, c] = env.TIMES.split(":").map(Number);
	times = [];
	for (let t = a; t <= b + 1e-9; t += c) times.push(Math.round(t * 100) / 100);
} else times = env.TIMES.split(",").map(Number);
await page.cdp("Emulation.setDeviceMetricsOverride", {
	width: w,
	height: h,
	deviceScaleFactor: dpr,
	mobile,
});
await page.goto(`http://localhost:${env.PORT}/learn/${env.LESSON}`);
await page.evaluate((loc) => {
	localStorage.setItem("tradely.locale", loc);
	// biome-ignore lint/suspicious/noDocumentCookie: the page sets the app's locale cookie, as its switcher does
	document.cookie = `tradely.locale=${loc}; Path=/; Max-Age=31536000; SameSite=Lax`;
	localStorage.setItem("theme", "light");
}, env.LOCALE || "en");
await page.reload();
await page.waitForSelector("loc=css:.wt-film-svg", {
	state: "visible",
	timeout: 90000,
});
await page.waitForTimeout(1500);
await page.evaluate(() => {
	window.__errors = [];
	window.addEventListener("error", (e) =>
		window.__errors.push(String(e.message)),
	);
	const o = console.error;
	console.error = (...a) => {
		window.__errors.push(a.map(String).join(" ").slice(0, 200));
		o(...a);
	};
});
// Pause through the player's own button, clicked in the page: a layout's overlay can sit
// over it on a phone, and the player would otherwise keep driving the timeline.
await page.evaluate(() => document.querySelector('[data-nav="play"]').click());
const clip = await page.evaluate(() => {
	const el = document.querySelector(".wt-player");
	window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
	const b = document.querySelector(".wt-film").getBoundingClientRect();
	return {
		x: Math.floor(b.left),
		y: Math.floor(b.top + window.scrollY),
		width: Math.ceil(b.width),
		height: Math.ceil(b.height),
	};
});
const spills = [];
const overlaps = [];
const crossings = [];
const edges = [];
for (let i = 0; i < times.length; i++) {
	await page.evaluate((t) => {
		const tl = window.__tradelyFilm;
		tl.pause();
		tl.seek(t, false);
	}, times[i]);
	await page.waitForTimeout(70);
	await page.screenshot({
		path: `${env.OUT}/${env.PREFIX}-${String(i).padStart(3, "0")}.png`,
		clip,
	});
	const r = await page.evaluate(() => {
		const svg = document.querySelector(".wt-film-svg");
		const box = svg.getBoundingClientRect();
		const tl = window.__tradelyFilm;
		const now = tl.time();
		const layer = svg.querySelector('[data-f="carry-layer"]');
		const MOVES = ["x", "y", "scale", "scaleX", "scaleY", "rotation"];
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
		// In flight: in the carry layer, or moved by a running tween on itself or a parent other
		// than the camera. A mark held at a scale is settled.
		const flying = (t) => {
			if (layer?.contains(t)) return true;
			for (let e = t; e && e !== svg; e = e.parentElement) {
				if (["world", "depth"].includes(e.getAttribute("data-f"))) continue;
				for (const tw of tl.getTweensOf(e)) {
					const s = tw.startTime();
					if (
						MOVES.some((k) => k in tw.vars) &&
						tw.duration() > 0 &&
						now >= s &&
						now < s + tw.duration()
					)
						return true;
				}
			}
			return false;
		};
		const spills = [...svg.querySelectorAll("text")]
			.filter(
				(t) =>
					t.textContent.trim() &&
					alpha(t) > 0.05 &&
					!t.closest('[data-f="world"]'),
			)
			.map((t) => ({
				t: t.textContent.slice(0, 28),
				r: t.getBoundingClientRect(),
			}))
			.filter(
				({ r }) =>
					r.width &&
					(r.left < box.left - 1 ||
						r.right > box.right + 1 ||
						r.top < box.top - 1 ||
						r.bottom > box.bottom + 1),
			)
			.map((x) => x.t);
		const settled = [...svg.querySelectorAll("text")].filter(
			(t) => t.textContent.trim() && alpha(t) > 0.6 && !flying(t),
		);
		const boxesOf = (t, k) =>
			(t.querySelectorAll("tspan").length
				? [...t.querySelectorAll("tspan")]
				: [t]
			)
				.map((s) => s.getBoundingClientRect())
				.filter((q) => q.width > 0)
				.map((q) => ({
					left: q.left + 1,
					right: q.right - 1,
					top: q.top + q.height * k,
					bottom: q.bottom - q.height * k,
				}));
		// Overlaps: a text's box is its line's height; its glyphs fill roughly the middle two thirds.
		const items = settled.map((t) => ({
			t: t.textContent.slice(0, 24),
			boxes: boxesOf(t, 0.18),
		}));
		const hits = [];
		for (let i = 0; i < items.length; i++)
			for (let j = i + 1; j < items.length; j++) {
				for (const a of items[i].boxes)
					for (const b of items[j].boxes) {
						const ow = Math.min(a.right, b.right) - Math.max(a.left, b.left);
						const oh = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
						if (ow > 2 && oh > 3 && items[i].t !== items[j].t)
							hits.push(`${items[i].t} × ${items[j].t}`);
					}
			}
		// Crossings: settled text struck by a visible stroked line.
		const texts = settled.map((t) => ({
			t: t.textContent.slice(0, 22),
			boxes: boxesOf(t, 0.22),
		}));
		const cross = [];
		const lines = [...svg.querySelectorAll("path, line, polyline")].filter(
			(p) => {
				const cls = p.getAttribute("class") || "";
				if (
					/wt-grid|wt-axis|wt-backdrop|wt-film-grid/.test(cls) ||
					/-strike$/.test(p.getAttribute("data-f") || "") ||
					p.closest('[data-f="drift"]') ||
					p.closest("defs, clipPath, pattern, mask")
				)
					return false;
				const cs = getComputedStyle(p);
				return (
					cs.stroke !== "none" &&
					cs.visibility !== "hidden" &&
					alpha(p) > 0.5 &&
					p.getTotalLength &&
					p.getTotalLength() > 0
				);
			},
		);
		for (const p of lines) {
			const m = p.getScreenCTM();
			if (!m) continue;
			const len = p.getTotalLength();
			const step = Math.max(2, len / 400);
			const pts = [];
			for (let s = 0; s <= len; s += step) {
				const q = p.getPointAtLength(s);
				pts.push({
					x: m.a * q.x + m.c * q.y + m.e,
					y: m.b * q.x + m.d * q.y + m.f,
				});
			}
			const name =
				p.getAttribute("data-f") ||
				p.closest("[data-f]")?.getAttribute("data-f") ||
				(p.getAttribute("class") || "path").split(" ")[0];
			for (const t of texts) {
				let n = 0;
				for (const q of pts)
					for (const b of t.boxes)
						if (q.x > b.left && q.x < b.right && q.y > b.top && q.y < b.bottom)
							n++;
				if (n >= 2) cross.push(`${t.t} ~ ${name}`);
			}
		}
		// Edges: text and lock brackets keep 12 px from a phone frame's sides, 6 px wider.
		const gap = box.width < 520 ? 12 : 6;
		const edge = [];
		for (const t of texts)
			for (const b of t.boxes) {
				const inside =
					b.right > box.left &&
					b.left < box.right &&
					b.bottom > box.top &&
					b.top < box.bottom;
				if (inside && (b.left < box.left + gap || b.right > box.right - gap))
					edge.push(t.t);
			}
		for (const k of svg.querySelectorAll(".wt-film-lock")) {
			if (alpha(k) < 0.25) continue;
			const q = k.getBoundingClientRect();
			if (
				q.width &&
				(q.left < box.left + gap ||
					q.right > box.right - gap ||
					q.top < box.top + 4 ||
					q.bottom > box.bottom - 4)
			)
				edge.push(k.getAttribute("data-f") || "lock");
		}
		return {
			spills,
			overlaps: [...new Set(hits)],
			crossings: [...new Set(cross)],
			edges: [...new Set(edge)],
		};
	});
	if (r.spills.length) spills.push([times[i], r.spills]);
	if (r.overlaps.length) overlaps.push([times[i], r.overlaps]);
	if (r.crossings.length) crossings.push([times[i], r.crossings]);
	if (r.edges.length) edges.push([times[i], r.edges]);
}
console.log(
	JSON.stringify({
		prefix: env.PREFIX,
		frames: times.length,
		clip,
		duration: await page.evaluate(() => window.__tradelyFilm.duration()),
		labels: await page.evaluate(() => window.__tradelyFilm.labels),
		errors: await page.evaluate(() => window.__errors),
		spills,
		overlaps,
		crossings,
		edges,
	}),
);
await page.cdp("Emulation.setDeviceMetricsOverride", {
	width: 1440,
	height: 900,
	deviceScaleFactor: 1,
	mobile: false,
});
