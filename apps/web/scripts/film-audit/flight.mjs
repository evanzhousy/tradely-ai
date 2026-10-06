// One page of the film audit (run by film-audit.sh in ego-browser). Seeks every 0.1 s and
// checks marks in flight (carried copies, or text moved by a running tween on itself or a
// parent, the camera and exits aside) against everything visible.
// env: SPACE, LESSON, END, SIZE, LOCALE, PORT
//   fly    flying text within 6 px of settled text (a true overlap when it is settling in
//          place), or two flights over each other
//   mark   flying text over a bar, dot, line or bracket before its last 15 % of travel,
//          except a mark it sets off from or comes to rest on
//   double a carried copy over its own original (same text, even dimmed) for 0.3 s or more
//   colour a carried copy whose colour differs from the text it hands over to
//   early  a carry's target already showing before the copy that becomes it lands
//   enter  a line rising into place (show's entrance) through settled text, every 0.05 s
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
await page.click('loc=css:[data-nav="play"]', { label: "pause the film" });
const hits = await page.evaluate((end) => {
	const tl = window.__tradelyFilm;
	tl.pause();
	const svg = document.querySelector(".wt-film-svg");
	const frame = svg.getBoundingClientRect();
	const layer = svg.querySelector('[data-f="carry-layer"]');
	const alpha = (el) => {
		let a = 1;
		for (let e = el; e && e !== svg; e = e.parentElement)
			a *= Number(getComputedStyle(e).opacity);
		return a;
	};
	const MOVES = ["x", "y", "scale", "scaleX", "scaleY", "rotation"];
	// The share of its travel a mark has covered at `time`, or -1 when nothing moves it.
	const travel = (el, time) => {
		let p = -1;
		for (let e = el; e && e !== svg; e = e.parentElement) {
			// The camera moves the whole chart together: nothing flies relative to anything else.
			if (["world", "depth"].includes(e.getAttribute("data-f"))) continue;
			for (const tw of tl.getTweensOf(e)) {
				// Exits (a move that fades to nothing) are leaving, not flying.
				if (!MOVES.some((k) => k in tw.vars) || tw.vars.opacity === 0) continue;
				const s = tw.startTime();
				const d = tw.duration();
				if (d > 0 && time >= s && time < s + d) p = Math.max(p, (time - s) / d);
			}
		}
		return p;
	};
	const boxes = (t) =>
		(t.querySelectorAll("tspan").length
			? [...t.querySelectorAll("tspan")]
			: [t]
		)
			.map((s) => s.getBoundingClientRect())
			.filter((r) => r.width > 0)
			.map((r) => ({
				l: r.left + 1,
				r: r.right - 1,
				t: r.top + r.height * 0.22,
				b: r.bottom - r.height * 0.22,
			}));
	const meet = (xs, ys, dx = 2, dy = 2) => {
		for (const x of xs)
			for (const y of ys)
				if (
					Math.min(x.r, y.r) - Math.max(x.l, y.l) > dx &&
					Math.min(x.b, y.b) - Math.max(x.t, y.t) > dy
				)
					return true;
		return false;
	};
	const centre = (bs) => {
		const l = Math.min(...bs.map((q) => q.l));
		const r = Math.max(...bs.map((q) => q.r));
		const t = Math.min(...bs.map((q) => q.t));
		const b = Math.max(...bs.map((q) => q.b));
		return { x: (l + r) / 2, y: (t + b) / 2, w: r - l, h: b - t };
	};
	const name = (el) =>
		el.getAttribute("data-f") ||
		el.closest("[data-f]")?.getAttribute("data-f") ||
		(el.getAttribute("class") || el.tagName).split(" ")[0];
	// Whether a mark lies across boxes: a shape by its box, a line by points along it.
	const strikes = (bs, m) => {
		const ctm = m.getScreenCTM();
		if (!ctm) return false;
		if (
			m.tagName === "rect" ||
			m.tagName === "circle" ||
			getComputedStyle(m).fill !== "none"
		) {
			const r = m.getBoundingClientRect();
			return meet(bs, [{ l: r.left, r: r.right, t: r.top, b: r.bottom }]);
		}
		if (!m.getTotalLength) return false;
		const len = m.getTotalLength();
		const step = Math.max(2, len / 300);
		let n = 0;
		for (let s = 0; s <= len; s += step) {
			const q = m.getPointAtLength(s);
			const x = ctm.a * q.x + ctm.c * q.y + ctm.e;
			const y = ctm.b * q.x + ctm.d * q.y + ctm.f;
			for (const b of bs) if (x > b.l && x < b.r && y > b.t && y < b.b) n++;
			if (n >= 2) return true;
		}
		return false;
	};
	// Where a moving text set off from and comes to rest: its boxes when its running moves
	// start and end.
	const rests = new Map();
	const restOf = (f, time, first = false) => {
		let stop = first ? Number.NEGATIVE_INFINITY : time;
		for (let e = f; e && e !== svg; e = e.parentElement) {
			if (["world", "depth"].includes(e.getAttribute("data-f"))) continue;
			for (const tw of tl.getTweensOf(e)) {
				if (!MOVES.some((k) => k in tw.vars)) continue;
				const s0 = tw.startTime();
				const d = tw.duration();
				if (time >= s0 && time < s0 + d)
					stop = first
						? stop === Number.NEGATIVE_INFINITY
							? s0
							: Math.min(stop, s0)
						: Math.max(stop, s0 + d);
			}
		}
		if (first) stop = (stop === Number.NEGATIVE_INFINITY ? time : stop) + 0.002;
		const key = `${first}:${stop}`;
		if (!rests.has(f)) rests.set(f, new Map());
		const known = rests.get(f);
		if (!known.has(key)) {
			tl.seek(stop - (first ? 0 : 0.001), false);
			known.set(key, boxes(f));
			tl.seek(time, false);
		}
		return known.get(key);
	};
	const out = {};
	const add = (k, time) => {
		if (!out[k]) out[k] = [];
		out[k].push(time);
	};
	const doubles = {};
	for (let time = 0; time <= end; time = Math.round((time + 0.1) * 10) / 10) {
		tl.seek(time, false);
		const texts = [...svg.querySelectorAll("text")].filter((t) =>
			t.textContent.trim(),
		);
		const flying = texts.filter(
			(t) => alpha(t) > 0.3 && (layer?.contains(t) || travel(t, time) >= 0),
		);
		if (!flying.length) continue;
		const settled = texts.filter((t) => alpha(t) > 0.6 && !flying.includes(t));
		// Moving against moving: two flights that cross each other.
		for (let i = 0; i < flying.length; i++)
			for (let j = i + 1; j < flying.length; j++) {
				const a = flying[i].textContent.trim();
				const b = flying[j].textContent.trim();
				if (a === b) continue;
				if (meet(boxes(flying[i]), boxes(flying[j])))
					add(`fly ${a.slice(0, 18)} ⇄ ${b.slice(0, 18)}`, time);
			}
		// A copy over its own original, even a dimmed one: it should lift off, not slide out.
		for (const f of flying) {
			if (!layer?.contains(f)) continue;
			const a = f.textContent.trim();
			for (const s of texts)
				if (
					s !== f &&
					!layer.contains(s) &&
					s.textContent.trim() === a &&
					alpha(s) > 0.1 &&
					meet(boxes(f), boxes(s), 1, 1)
				) {
					const key = a.slice(0, 18);
					if (!doubles[key]) doubles[key] = [];
					doubles[key].push(time);
				}
		}
		const marks = [
			...svg.querySelectorAll("rect, circle, path, line, polyline"),
		].filter((p) => {
			const cls = p.getAttribute("class") || "";
			if (
				/wt-grid|wt-axis|wt-backdrop|wt-film-grid|wt-panel-shape|wt-focus-shape/.test(
					cls,
				) ||
				layer?.contains(p) ||
				p.closest("defs, clipPath, pattern, mask") ||
				alpha(p) < 0.5
			)
				return false;
			const r = p.getBoundingClientRect();
			if (!r.width && !r.height) return false;
			if (r.width * r.height > frame.width * frame.height * 0.25) return false;
			const cs = getComputedStyle(p);
			return (
				cs.visibility !== "hidden" &&
				(cs.stroke !== "none" || cs.fill !== "none")
			);
		});
		for (const f of flying) {
			const a = f.textContent.trim();
			const fb = boxes(f);
			const fc = centre(fb);
			const p = travel(f, time);
			// Settling in place (an entrance, a flip, the last few px of a landing): only a true
			// overlap counts, since neighbours such as a symbol's parts abut by design. In flight,
			// it keeps 6 px clear.
			const restC = p >= 0 ? centre(restOf(f, time)) : fc;
			const inPlace = Math.hypot(fc.x - restC.x, fc.y - restC.y) < 16;
			for (const s of settled) {
				const b = s.textContent.trim();
				const sb = boxes(s);
				if (a === b) continue;
				if (a.includes(b) || b.includes(a)) continue;
				// A landing, not a crossing: a copy whose centre sits on its own target (data-to).
				// Any other text under it is a collision.
				const sc = centre(sb);
				const target = layer?.contains(f)
					? svg.querySelector(`[data-f="${f.getAttribute("data-to")}"]`)
					: null;
				if (
					target &&
					(s === target || target.contains(s)) &&
					Math.abs(fc.x - sc.x) < sc.w * 0.35 &&
					Math.abs(fc.y - sc.y) < Math.max(sc.h, 6)
				)
					continue;
				const pad = inPlace ? 0 : 6;
				if (
					meet(
						fb.map((q) => ({
							l: q.l - pad,
							r: q.r + pad,
							t: q.t - pad * 0.7,
							b: q.b + pad * 0.7,
						})),
						sb,
					)
				)
					add(`fly ${a.slice(0, 18)} × ${b.slice(0, 18)}`, time);
			}
			if (p >= 0.85 || p < 0) continue;
			// A mark the text comes to rest on (a label on its bar or band) is its landing place;
			// one it sets off from is where it was born.
			const rest = restOf(f, time);
			const born = restOf(f, time, true);
			for (const m of marks) {
				if (m.closest("text") || strikes(rest, m) || strikes(born, m)) continue;
				if (strikes(fb, m)) add(`mark ${a.slice(0, 18)} × ${name(m)}`, time);
			}
		}
	}
	for (const [k, ts] of Object.entries(doubles)) {
		// Three samples in a row, 0.3 s on top of its original: longer than a lift-off.
		const run = ts.reduce(
			(acc, t, i) =>
				i && Math.abs(t - ts[i - 1] - 0.1) < 0.01
					? [acc[0] + 1, Math.max(acc[1], acc[0] + 1)]
					: [1, Math.max(acc[1], 1)],
			[0, 0],
		)[1];
		if (run >= 3) out[`double ${k}`] = ts;
	}
	// Colour at the handoff: the copy just before it lands against what shows there just after.
	for (const f of layer ? [...layer.children] : []) {
		const tws = tl
			.getTweensOf(f)
			.filter((tw) => MOVES.some((k) => k in tw.vars));
		if (!tws.length) continue;
		const land = Math.max(...tws.map((tw) => tw.startTime() + tw.duration()));
		tl.seek(land - 0.01, false);
		const fill = getComputedStyle(f).fill;
		const c = centre(boxes(f));
		tl.seek(land + 0.05, false);
		// The browser hands back a text, not its tspan: take the tspan under the point if any.
		const there = document
			.elementsFromPoint(c.x, c.y)
			.filter(
				(e) =>
					e.tagName === "text" &&
					svg.contains(e) &&
					!layer.contains(e) &&
					alpha(e) > 0.6,
			)
			.map(
				(e) =>
					[...e.querySelectorAll("tspan")].find((t) => {
						const r = t.getBoundingClientRect();
						return (
							c.x >= r.left && c.x <= r.right && c.y >= r.top && c.y <= r.bottom
						);
					}) || e,
			);
		if (there.length) {
			const got = getComputedStyle(there[0]).fill;
			if (got !== fill)
				out[`colour ${f.textContent.trim().slice(0, 18)} ${fill} → ${got}`] = [
					Math.round(land * 100) / 100,
				];
		}
	}
	// Early: a copy that becomes its target (data-mode "become") lands on text that is not yet
	// showing; checked at 0.1 s steps through its flight. With a match, the matching tspan counts.
	for (const f of layer ? [...layer.children] : []) {
		if (f.getAttribute("data-mode") !== "become") continue;
		const to = svg.querySelector(`[data-f="${f.getAttribute("data-to")}"]`);
		if (!to) continue;
		const tws = tl
			.getTweensOf(f)
			.filter((tw) => MOVES.some((k) => k in tw.vars));
		if (!tws.length) continue;
		const start = Math.min(...tws.map((tw) => tw.startTime()));
		const land = Math.max(...tws.map((tw) => tw.startTime() + tw.duration()));
		const match = f.getAttribute("data-match");
		const part = match
			? [...to.querySelectorAll("tspan")].find(
					(t) => t.textContent.trim() === match,
				)
			: null;
		for (
			let t = Math.ceil(start * 10) / 10 + 0.1;
			t < land - 0.05;
			t = Math.round((t + 0.1) * 10) / 10
		) {
			tl.seek(t, false);
			if (alpha(f) < 0.3) continue;
			const shown =
				alpha(to) * (part ? Number(getComputedStyle(part).fillOpacity) : 1);
			if (shown > 0.3)
				add(
					`early ${f.textContent.trim().slice(0, 18)} → ${f.getAttribute("data-to")}`,
					t,
				);
		}
	}
	// Enter: a line coming up into place (a fromTo from opacity 0 with an offset) must not pass
	// through settled text on its way, even while still faint.
	const svgTexts = () =>
		[...svg.querySelectorAll("text")].filter((t) => t.textContent.trim());
	for (const tw of tl.getChildren(true, true, false)) {
		const from = tw.vars.startAt;
		if (
			!from ||
			Number(from.opacity) !== 0 ||
			!(Number(from.y) || Number(from.x)) ||
			!(Number(tw.vars.opacity) >= 0.9)
		)
			continue;
		const s0 = tw.startTime();
		for (const target of tw.targets()) {
			if (!(target instanceof Element)) continue;
			const own =
				target.tagName === "text"
					? [target]
					: [...target.querySelectorAll("text")];
			if (!own.length) continue;
			for (let k = 1; k <= 7; k++) {
				const t = Math.round((s0 + k * 0.05) * 100) / 100;
				tl.seek(t, false);
				const others = svgTexts().filter(
					(x) =>
						!own.includes(x) &&
						!layer?.contains(x) &&
						alpha(x) > 0.6 &&
						travel(x, t) < 0,
				);
				for (const e of own) {
					if (alpha(e) < 0.15) continue;
					for (const o of others)
						if (meet(boxes(e), boxes(o)))
							add(
								`enter ${e.textContent.trim().slice(0, 18)} × ${o.textContent.trim().slice(0, 18)}`,
								t,
							);
				}
			}
		}
	}
	for (const k of Object.keys(out))
		out[k] = [...new Set(out[k])].sort((a, b) => a - b);
	return out;
}, Number(env.END) - 2);
console.log(JSON.stringify(hits));
