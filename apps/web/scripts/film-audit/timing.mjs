// One page of the film audit (run by film-audit.sh in ego-browser). Audits a film's timing and
// copy from its timeline: every headline's hold, the question line, the claim and its second
// line, headline length and figures, the hero lock's share of the runtime (label "hero-lock"),
// the runtime, class names, and headlines stacked on one another. Then its motion: entrances
// and exits of at least 0.3 s, a hero that stands 1.5 s, no empty or faint stage between beats,
// and no crossfade printing one line over another, and the title card's name and subtitle each
// shown in full for its reading time before the tag lifts them. Warns when a headline states a
// figure the stage doesn't show yet ("made, not stated"), and when a line is up for less than
// its reading time at timed-text rates (20 characters a second in English, 9 in Chinese).
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
	// Every other text mark (tags, figures, labels) is sampled too, for its reading time only.
	const others = [...svg.querySelectorAll("text[data-f]")].filter(
		(el) =>
			!prose.includes(el) &&
			!el.closest(
				'[data-f="end"], [data-f="title-group"], [data-f="carry-layer"]',
			) &&
			!/^title/.test(el.getAttribute("data-f") || ""),
	);
	const seen = new Map([...prose, ...others].map((el) => [el, []]));
	for (let t = 0; t <= duration + 0.001; t += 0.1) {
		tl.seek(t, false);
		for (const el of seen.keys()) {
			const runs = seen.get(el);
			const on = alpha(el) >= 0.6;
			const last = runs.at(-1);
			if (on && last && last.to === null) continue;
			if (on) runs.push({ from: t, to: null });
			else if (last && last.to === null) last.to = t;
		}
	}
	// A run that begins or ends with another mark of the same text in its place (a proxy set
	// over the mark it carries, a carry's landing copy handing over to the mark it became), or
	// that ends as a carried copy of it takes flight, is a hand-over, not a short reading.
	const marksOf = [...seen.keys()];
	const flyers = () => [...svg.querySelectorAll('[data-f="carry-layer"] text')];
	const twin = (el, at) => {
		tl.seek(at, false);
		const box = el.getBoundingClientRect();
		const text = norm(textOf(el));
		return (
			marksOf.some(
				(o) =>
					o !== el &&
					norm(textOf(o)) === text &&
					alpha(o) >= 0.6 &&
					meet(o.getBoundingClientRect(), box),
			) || flyers().some((o) => norm(textOf(o)) === text && alpha(o) >= 0.3)
		);
	};
	for (const [el, runs] of seen)
		for (const r of runs)
			if (r.to !== null) r.handover = twin(el, r.to) || twin(el, r.from);
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
	const marks = [];
	for (const [el, runs] of seen) {
		const text = textOf(el);
		const size = Number.parseFloat(getComputedStyle(el).fontSize) || 0;
		if (!prose.includes(el)) {
			for (const r of runs)
				if (r.from > 0.05 && text)
					marks.push({
						name: el.getAttribute("data-f"),
						text,
						size,
						from: Math.round(r.from * 10) / 10,
						hold: Math.round(((r.to ?? duration) - r.from) * 10) / 10,
						handover: r.handover === true,
					});
			continue;
		}
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
					handover: r.handover === true,
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
	// What the stage shows of a mark: its opacity, and nothing at all when it or a group it
	// sits in is set to display none or hidden, when it has no area yet (a bar about to grow),
	// or when it is a line whose every part is hidden (its tspans gated one by one).
	const own = (el, top) => {
		let a = Number(el.getAttribute("fill-opacity") ?? 1);
		for (let e = el; e && e !== top; e = e.parentElement)
			a *= Number(getComputedStyle(e).opacity);
		return a;
	};
	const shows = (el) => {
		for (let e = el; e && e !== svg; e = e.parentElement) {
			const cs = getComputedStyle(e);
			if (cs.display === "none" || cs.visibility === "hidden") return 0;
		}
		const r = el.getBoundingClientRect();
		if (r.width < 1 || r.height < 1) return 0;
		const parts =
			el.tagName === "text" ? [...el.querySelectorAll("tspan")] : [];
		const inner = parts.length ? Math.max(...parts.map((t) => own(t, el))) : 1;
		return alpha(el) * inner * Number(el.getAttribute("fill-opacity") ?? 1);
	};
	const layer = svg.querySelector('[data-f="carry-layer"]');
	const MOVES = ["x", "y", "scale", "scaleX", "scaleY", "rotation"];
	const SHOWS = [
		"opacity",
		"autoAlpha",
		"display",
		"visibility",
		"scale",
		"scaleY",
	];
	// A text, a figure or a panel: what the motion floor and the hero rules are about.
	const isUnit = (e) =>
		(e.tagName === "text" && e.textContent.trim()) ||
		(e.tagName === "rect" &&
			/\bwt-(panel-shape|focus-shape|chip)\b/.test(
				e.getAttribute("class") || "",
			));
	const unitsOf = (target) => {
		if (
			!(target instanceof Element) ||
			!svg.contains(target) ||
			layer?.contains(target)
		)
			return [];
		// A tspan is shown and hidden as part of its line.
		if (target.tagName === "tspan") return [target];
		return [target, ...target.querySelectorAll("text, rect")].filter(isUnit);
	};
	const short = (n) =>
		`${n.closest("[data-f]")?.getAttribute("data-f") ?? n.tagName} "${n.textContent.trim().slice(0, 24)}"`;
	// A carry's hand-overs: its copy takes the original's place as it lifts off (the copy is a
	// clone, so its untransformed box is the original's), and gives way to its target as it
	// lands. One image moving, not a pop.
	const sameBox = (a, b) => {
		const p = a.getBBox();
		const q = b.getBBox();
		return (
			Math.abs(p.x - q.x) < 1 &&
			Math.abs(p.y - q.y) < 1 &&
			Math.abs(p.width - q.width) < 2
		);
	};
	const carries = [...(layer?.children ?? [])]
		.map((f) => {
			const tws = tl.getTweensOf(f);
			if (!tws.length || !(f instanceof SVGGraphicsElement)) return null;
			return {
				copy: f,
				to: svg.querySelector(`[data-f="${f.getAttribute("data-to")}"]`),
				start: Math.min(...tws.map((tw) => tw.startTime())),
				land: Math.max(...tws.map((tw) => tw.startTime() + tw.duration())),
			};
		})
		.filter(Boolean);
	const handover = (unit, t) =>
		carries.some(
			(c) =>
				(Math.abs(t - c.start) < 0.02 &&
					[unit, ...unit.querySelectorAll("*")].some(
						(e) => e.tagName === c.copy.tagName && sameBox(e, c.copy),
					)) ||
				(Math.abs(t - c.land) < 0.02 &&
					((c.to &&
						(c.to === unit || c.to.contains(unit) || unit.contains(c.to))) ||
						(unit.tagName === c.copy.tagName && sameBox(unit, c.copy)))),
		);
	const area = (r) =>
		Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
	const shared = (p, q) =>
		area({
			left: Math.max(p.left, q.left),
			right: Math.min(p.right, q.right),
			top: Math.max(p.top, q.top),
			bottom: Math.min(p.bottom, q.bottom),
		}) / Math.max(1, Math.min(area(p), area(q)));
	const stage = () =>
		[...svg.querySelectorAll("text, rect, tspan[data-f]")].filter(
			(e) =>
				(isUnit(e) || (e.tagName === "tspan" && e.textContent.trim())) &&
				!layer?.contains(e) &&
				!e.closest("[data-f='title-group'], [data-f='title-sub']"),
		);
	// Motion floor: a text, a figure or a panel comes on and goes off over at least 0.3 s. Each
	// tween or set shorter than that is measured by what the stage shows just before and just
	// after it: a change of half its strength or more is a pop. Not a pop: a carry's hand-over;
	// a swap in place (one mark goes as another comes in its place, a value set anew); a mark
	// that vanishes as its flight ends, onto what it lands on; and a cut, where the whole stage
	// changes at once.
	const changes = new Map();
	for (const tw of tweens) {
		const d = tw.duration();
		const s = tw.startTime();
		if (d >= 0.295 || s <= 0.05) continue;
		const keys = [
			...Object.keys(tw.vars),
			...Object.keys(tw.vars.startAt ?? {}),
		];
		if (!keys.some((k) => SHOWS.includes(k))) continue;
		const units = tw.targets().flatMap(unitsOf);
		if (units.length) changes.set(tw, units);
	}
	const pops = [];
	const all = stage();
	for (const [tw, units] of changes) {
		const s = tw.startTime();
		const d = tw.duration();
		tl.seek(s - 0.005, false);
		const before = new Map(all.map((e) => [e, shows(e)]));
		const boxBefore = new Map(units.map((u) => [u, u.getBoundingClientRect()]));
		tl.seek(s + d + 0.005, false);
		const after = new Map(all.map((e) => [e, shows(e)]));
		const flips = all.filter(
			(e) => Math.abs(after.get(e) - before.get(e)) >= 0.5,
		);
		const lit = all.filter((e) => before.get(e) >= 0.5 || after.get(e) >= 0.5);
		const cut = lit.length > 0 && flips.length / lit.length >= 0.6;
		for (const u of units) {
			const was = before.get(u) ?? shows(u);
			const now = after.get(u) ?? shows(u);
			const change = now - was;
			const pop = (was < 0.1 && now >= 0.5) || (was >= 0.5 && now < 0.1);
			if (!pop || cut || handover(u, s)) continue;
			const box = change < 0 ? boxBefore.get(u) : u.getBoundingClientRect();
			const swap = flips.some(
				(e) =>
					e !== u &&
					!e.contains(u) &&
					!u.contains(e) &&
					Math.sign(after.get(e) - before.get(e)) === -Math.sign(change) &&
					shared(box, e.getBoundingClientRect()) >= 0.5,
			);
			if (swap) continue;
			// A flight that ends by vanishing onto what it lands on.
			let landing = false;
			if (change < 0)
				for (let e = u; e && e !== svg && !landing; e = e.parentElement)
					landing = tl
						.getTweensOf(e)
						.some(
							(o) =>
								MOVES.some((k) => k in o.vars) &&
								o.startTime() + o.duration() <= s + 0.06 &&
								o.startTime() + o.duration() >= s - 0.06,
						);
			if (landing) continue;
			pops.push({
				at: s,
				text: `pop ${change > 0 ? "in" : "out"} ${short(u)} at ${s.toFixed(2)} over ${d.toFixed(2)} s (≥ 0.3)`,
			});
			break;
		}
	}
	// The hero stands: from its glow at full strength, nothing the brackets hold (nor a group it
	// sits in) moves or fades for 1.5 s, and no copy of it is carried away.
	let stand = null;
	if (glow.on !== null) {
		tl.seek(glow.on, false);
		const lock = glows.find((g) => alpha(g) >= 0.8);
		const box = lock.getBoundingClientRect();
		const held = [...svg.querySelectorAll("text")].filter((t) => {
			if (!t.textContent.trim() || layer?.contains(t) || shows(t) < 0.6)
				return false;
			const r = t.getBoundingClientRect();
			const cx = (r.left + r.right) / 2;
			const cy = (r.top + r.bottom) / 2;
			return (
				cx > box.left &&
				cx < box.right &&
				cy > box.top &&
				cy < box.bottom &&
				r.width <= box.width + 4
			);
		});
		let leaves = { at: duration, what: "the end" };
		for (const t of held)
			for (let e = t; e && e !== svg; e = e.parentElement)
				for (const tw of tl.getTweensOf(e)) {
					const s = tw.startTime();
					const v = tw.vars;
					const fades = typeof v.opacity === "number" && v.opacity < 0.9;
					if (
						s > glow.on + 0.01 &&
						s < leaves.at &&
						(fades || MOVES.some((k) => k in v))
					)
						leaves = { at: s, what: short(t) };
				}
		for (const c of carries)
			if (
				c.start > glow.on + 0.01 &&
				c.start < leaves.at &&
				held.some((t) => t.tagName === c.copy.tagName && sameBox(t, c.copy))
			)
				leaves = {
					at: c.start,
					what: `a copy of "${c.copy.textContent.trim().slice(0, 24)}"`,
				};
		stand = {
			texts: held.map((t) => t.textContent.trim().slice(0, 24)),
			stands: leaves.at - glow.on,
			leaves: leaves.what,
		};
	}
	// Between beats the stage dips rather than cuts to nothing: it is never empty, and never
	// faint (nothing at half strength or more) for more than 0.1 s. Checked from the question
	// until the end card takes over, wherever something is fading out.
	const endNext = svg.querySelector('[data-f="end-next"]');
	const endAt = Math.min(
		duration,
		...tweens
			.filter(
				(tw) =>
					endNext && tw.targets().includes(endNext) && tw.startTime() > 0.05,
			)
			.map((tw) => tw.startTime() - 0.45),
	);
	const content = [
		...svg.querySelectorAll(
			"text, rect, path, circle, line, polyline, polygon, ellipse",
		),
	].filter((e) => {
		if (
			e.closest(
				"defs, clipPath, pattern, mask, [data-f='title-group'], [data-f='title-sub']",
			)
		)
			return false;
		if (e.tagName === "text") return Boolean(e.textContent.trim());
		const cls = e.getAttribute("class") || "";
		return !(
			/wt-film-bg|wt-film-grid/.test(cls) ||
			e.getAttribute("data-f") === "drift" ||
			(e.getAttribute("fill") || "").startsWith("url(#vig")
		);
	});
	const windows = tweens
		.filter((tw) => tw.vars.opacity === 0 || tw.vars.autoAlpha === 0)
		.map((tw) => [tw.startTime(), tw.startTime() + tw.duration() + 0.6]);
	// From when the question is up: the first moment after its label that something shows at
	// full strength.
	let dipFrom = tl.labels.question ?? 2;
	for (
		;
		dipFrom < duration;
		dipFrom = Math.round((dipFrom + 0.05) * 100) / 100
	) {
		tl.seek(dipFrom, false);
		if (
			content.some(
				(e) =>
					!e.closest("[data-f='title-group']") &&
					e.tagName === "text" &&
					shows(e) >= 0.9,
			)
		)
			break;
	}
	// Spans, sampled every 0.01 s: empty (nothing above 0.1) and faint (nothing above 0.3).
	const dips = [];
	const open = { empty: null, faint: null };
	const close = (kind, t) => {
		const run = open[kind];
		if (run)
			dips.push({ kind, at: run, span: Math.round((t - run) * 100) / 100 });
		open[kind] = null;
	};
	for (let t = dipFrom; t < endAt; t = Math.round((t + 0.01) * 100) / 100) {
		if (!windows.some(([a, b]) => t >= a && t <= b)) {
			close("empty", t);
			close("faint", t);
			continue;
		}
		tl.seek(t, false);
		let most = 0;
		for (const e of content) {
			most = Math.max(most, shows(e));
			if (most >= 0.3) break;
		}
		for (const [kind, line] of [
			["empty", 0.1],
			["faint", 0.3],
		])
			if (most < line) open[kind] ??= t;
			else close(kind, t);
	}
	close("empty", endAt);
	close("faint", endAt);
	// Crossfades dip: where a text comes in, what is leaving from that place is down to a
	// quarter before the new one reaches a quarter itself. Two lines never print over each
	// other mid-fade.
	const boxOf = (u) => {
		const r = u.getBoundingClientRect();
		return {
			l: r.left + 1,
			r: r.right - 1,
			t: r.top + r.height * 0.2,
			b: r.bottom - r.height * 0.2,
		};
	};
	const meets = (a, b) =>
		Math.min(a.r, b.r) - Math.max(a.l, b.l) > 2 &&
		Math.min(a.b, b.b) - Math.max(a.t, b.t) > 2;
	const crossfades = [];
	const told = new Set();
	for (const tw of tweens) {
		const s = tw.startTime();
		const d = tw.duration();
		const from = tw.vars.startAt;
		if (
			!(
				s > dipFrom &&
				s < endAt &&
				from &&
				Number(from.opacity) === 0 &&
				Number(tw.vars.opacity) >= 0.9
			)
		)
			continue;
		const units = tw
			.targets()
			.flatMap(unitsOf)
			.filter((u) => u.tagName !== "rect");
		if (!units.length) continue;
		const leaving = tweens
			.filter(
				(o) =>
					o.vars.opacity === 0 &&
					o.startTime() < s + d &&
					o.startTime() + o.duration() > s,
			)
			.flatMap((o) => o.targets().flatMap(unitsOf))
			.filter((u) => u.tagName !== "rect" && !units.includes(u));
		if (!leaving.length) continue;
		// How long the two print over each other, both above a quarter, from the first frame.
		let first = null;
		let pair = null;
		let span = 0;
		for (
			let t = s + 0.02;
			t <= s + d + 0.6;
			t = Math.round((t + 0.02) * 100) / 100
		) {
			tl.seek(t, false);
			const hit = pair
				? shows(pair[0]) > 0.25 &&
					shows(pair[1]) > 0.25 &&
					meets(boxOf(pair[0]), boxOf(pair[1]))
					? pair
					: null
				: units
						.filter((u) => shows(u) > 0.25)
						.flatMap((u) =>
							leaving
								.filter((g) => shows(g) > 0.25 && meets(boxOf(u), boxOf(g)))
								.map((g) => [u, g]),
						)[0];
			if (hit && !pair) {
				pair = hit;
				first = t;
			}
			if (pair && !hit) break;
			if (hit) span = t - first + 0.02;
		}
		if (!pair) continue;
		const key = `${short(pair[0])}|${short(pair[1])}`;
		if (told.has(key)) continue;
		told.add(key);
		crossfades.push({
			at: first,
			span,
			text: `crossfade ${short(pair[0])} prints over ${short(pair[1])} for ${span.toFixed(2)} s from ${first.toFixed(2)}`,
		});
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
	// Colours (runbook §5): only the stage's roles. A retired class, a data-tone outside the
	// roles, or a fill, stroke or stop colour that is a literal or a token the stage doesn't
	// define fails; so does a colour tween caught midway, which shows as a literal.
	const retired =
		/^wt-(long|short|long-soft|short-soft|line-long|line-short|label-long|label-short|arrow-shares|stack-time|ev-observed|ev-calculated|ev-modeled|ev-inferred)$/;
	const roleTones = new Set([
		"gain",
		"loss",
		"call",
		"put",
		"caution",
		"neutral",
		"total",
		"model",
	]);
	const stageTokens = new Set([
		"film-bg",
		"background",
		"card",
		"muted",
		"border",
		"foreground",
		"muted-foreground",
		"primary",
		"ring",
		"diagram-accent",
		"diagram-gain",
		"diagram-loss",
		"diagram-unknown",
		"diagram-model",
		"tone-focus",
		"tone-up",
		"tone-down",
		"tone-call",
		"tone-put",
		"tone-caution",
		"tone-ink",
		"tone-dim",
		"pen",
	]);
	const colours = new Set();
	const paint = (el, prop, value) => {
		const v = value.trim();
		if (!v) return;
		const where = `${el.closest("[data-f]")?.getAttribute("data-f") ?? el.tagName} ${prop}`;
		for (const [, name] of v.matchAll(/var\(--([\w-]+)/g))
			if (!stageTokens.has(name)) colours.add(`${where}: --${name}`);
		// What is left once tokens are taken out must be a keyword; a mix may lean toward white.
		const rest = v
			.replace(/var\(--[\w-]+(,[^()]*(\([^()]*\))?[^()]*)?\)/g, "")
			.replace(/url\([^)]*\)/g, "")
			.replace(/\bin (oklab|oklch|srgb)\b|[\d.]+%/g, "");
		const mix = /^color-mix\(/.test(v);
		const words =
			rest.match(/#[\da-f]{3,8}\b|[a-z][\w-]*\(|[a-z][\w-]*/gi) ?? [];
		for (const word of words) {
			const w = word.toLowerCase();
			if (w === "color-mix(") continue;
			if (["none", "transparent", "currentcolor", "inherit"].includes(w))
				continue;
			if (mix && (w === "white" || w === "black")) continue;
			// A tween of fill or stroke leaves its value behind as a literal rgb().
			colours.add(
				`${where}: ${v.slice(0, 60)}${/^rgba?\(/.test(v) ? " (a colour tween or a literal)" : ""}`,
			);
			break;
		}
	};
	for (let t = 0; t <= duration; t += 1) {
		tl.seek(t, false);
		for (const el of svg.querySelectorAll("[class]"))
			for (const c of (el.getAttribute("class") || "").split(/\s+/)) {
				if (/wt-.+wt-/.test(c)) bad.add(c);
				if (retired.test(c))
					colours.add(
						`${el.closest("[data-f]")?.getAttribute("data-f") ?? el.tagName} class ${c} (retired)`,
					);
			}
		for (const el of svg.querySelectorAll("*")) {
			// A mask or a clip is drawn in luminance, not on the stage.
			if (el.closest("mask, clipPath, filter")) continue;
			const tone = el.getAttribute("data-tone");
			if (tone && !roleTones.has(tone))
				colours.add(
					`${el.closest("[data-f]")?.getAttribute("data-f") ?? el.tagName} data-tone "${tone}"${tone === "short" ? " (retired)" : ""}`,
				);
			for (const prop of ["fill", "stroke", "stop-color"]) {
				const v = el.getAttribute(prop);
				if (v) paint(el, prop, v);
			}
			for (const decl of (el.getAttribute("style") || "").split(";")) {
				const at = decl.indexOf(":");
				if (at < 0) continue;
				const prop = decl.slice(0, at).trim().toLowerCase();
				if (
					["fill", "stroke", "stop-color", "color"].includes(prop) ||
					prop.startsWith("--")
				)
					paint(el, prop, decl.slice(at + 1));
			}
		}
	}
	// Counts (runbook §6): a figure that counts takes at least 1 s at 1×. A count is any tween
	// with an onUpdate that changes stage text while it runs (the kit's `count`, a film's own
	// counter of a plain object, or a tween of a mark that rewrites its readout); one shorter
	// than 0.05 s is a set.
	const shortCounts = [];
	const texts = () =>
		[...svg.querySelectorAll("text")]
			.map((el) => el.textContent)
			.join("\u0001");
	for (const tw of tweens) {
		const d = tw.duration();
		if (
			typeof tw.vars?.onUpdate !== "function" ||
			d < 0.05 ||
			d >= 1 - 1e-6 ||
			// The kit's pen (`{ done }`) follows a trace and a carry's flyer moves a copy; neither counts.
			tw.targets().some((x) => x && typeof x === "object" && "done" in x) ||
			tw
				.targets()
				.some(
					(x) => x instanceof Element && x.closest("[data-f='carry-layer']"),
				)
		)
			continue;
		// A count changes a readout while it runs; a tween that only moves a mark is not one.
		const at = tw.startTime();
		tl.seek(at + d * 0.25, false);
		const before = texts();
		tl.seek(at + d * 0.75, false);
		if (texts() !== before)
			shortCounts.push(
				`count at ${at.toFixed(2)} lasts ${d.toFixed(2)} s (< 1 s at 1×)`,
			);
	}
	// The title card: its name, shown in full once the wipe has passed the last letter (the
	// wipe runs on past the name, for a web font that lands wide), and its subtitle, at full
	// strength. Each is read until the tag lifts it.
	const titleCard = [];
	const titleEl = svg.querySelector("[data-f='title']");
	const wipeEl = svg.querySelector("[data-f='wipe']");
	const subEl = svg.querySelector("[data-f='title-sub']");
	const lift = tweens.find(
		(tw) => tw.targets().includes(titleEl?.parentNode) && "x" in tw.vars,
	);
	if (titleEl && wipeEl && lift) {
		const lifted = Math.round(lift.startTime() * 100) / 100;
		tl.seek(lifted - 0.05, false);
		const box = titleEl.getBBox();
		const wiped = () =>
			Number(wipeEl.getAttribute("x")) + Number(wipeEl.getAttribute("width")) >=
			box.x + box.width;
		const cardLines = [[titleEl, wiped]];
		if (subEl) cardLines.push([subEl, () => alpha(subEl) >= 0.98]);
		for (const [el, full] of cardLines) {
			let shown = null;
			for (let t = 0; t <= lifted + 1e-6 && shown === null; t += 0.01) {
				tl.seek(t, false);
				if (full()) shown = Math.round(t * 100) / 100;
			}
			titleCard.push({
				name: el.getAttribute("data-f"),
				text: textOf(el),
				shown,
				lifted,
			});
		}
	}
	return {
		duration,
		titleCard,
		headSize: typeHead,
		heroLock: tl.labels["hero-lock"],
		glow,
		sentences,
		marks,
		claim: claimRun ?? null,
		beats: [...beatNames],
		still,
		rows,
		badClasses: [...bad],
		colours: [...colours],
		shortCounts,
		stacked,
		stated,
		pops,
		stand,
		dips,
		crossfades,
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
for (const c of out.colours) fails.push(`colour ${c}`);
for (const s of out.stacked) fails.push(`stacked: ${s}`);
// The motion rules: entrances and exits of at least 0.3 s, a hero that stands 1.5 s, dips
// rather than cuts to nothing between beats, and crossfades that never print one line over
// another for long.
for (const p of out.pops) fails.push(p.text);
if (out.stand && out.stand.stands < 1.5)
	fails.push(
		`hero stands ${out.stand.stands.toFixed(2)} s before ${out.stand.leaves} moves or fades (≥ 1.5)`,
	);
for (const x of out.dips)
	if (
		(x.kind === "empty" && x.span >= 0.1) ||
		(x.kind === "faint" && x.span >= 0.2)
	)
		fails.push(
			`${x.kind === "empty" ? "empty stage" : "faint stage (nothing above 0.3)"} for ${x.span.toFixed(2)} s from ${x.at.toFixed(2)}`,
		);
for (const c of out.crossfades) if (c.span >= 0.15) fails.push(c.text);
// Reading time, at timed-text rates (Netflix): English 20 characters a second with spaces
// counted, Chinese 9 a second with half-width characters a half, and never under 0.83 s. The
// clock starts once a line is at full contrast and still, about 0.2 s into its entrance. Lines
// the hold rules above already cover (headlines, the question, the claim) are left out.
const readChars = (t) =>
	zh
		? [...t].reduce((n, c) => n + (/[⺀-鿿＀-￯]/.test(c) ? 1 : 0.5), 0)
		: t.length;
// The title card's two lines get the same reading time, from the frame each is shown in full
// to the tag. A line that can't be read there is shortened in the film: the heading above the
// film keeps the lesson's full name and subtitle.
for (const { name, text, shown, lifted } of out.titleCard) {
	const chars = readChars(text);
	const need = Math.max(0.83, chars / (zh ? 9 : 20));
	const held = shown === null ? 0 : lifted - shown;
	if (held < need - 0.05)
		fails.push(
			`${name} "${text}" ${zh ? chars : `${chars} chars`} needs ${need.toFixed(2)} s, shown in full ${held.toFixed(2)} s (${shown ?? "never"}–${lifted})`,
		);
}
// A text already read for long enough on an earlier run of the same mark (it dimmed and came
// back, or returned after a flight) needs no second reading interval.
const reads = [];
const read = new Map();
for (const x of [...out.sentences, ...out.marks].sort(
	(a, b) => a.from - b.from,
)) {
	if (named.test(x.name) || isClaim(x) || x.handover) continue;
	const chars = readChars(x.text);
	const need = Math.max(0.83, chars / (zh ? 9 : 20));
	const settled = x.hold - 0.2;
	const key = `${x.name}\u0000${x.text.replace(/\s+/g, " ")}`;
	if (settled >= need - 0.05) read.set(key, true);
	else if (!read.has(key))
		reads.push(
			`read ${x.name} at ${x.from.toFixed(1)}: ${zh ? chars : `${chars} chars`} needs ${need.toFixed(2)} s, settled ${settled.toFixed(2)} s${x.size < out.headSize * 0.6 ? " (small)" : ""} "${x.text.slice(0, 40)}"`,
		);
}
console.log(
	JSON.stringify({
		lesson: env.LESSON,
		config: `${env.SIZE}:${env.LOCALE}`,
		runtime: Math.round(play * 10) / 10,
		heroLock: out.heroLock,
		titleCard: out.titleCard,
		fails,
		warnings: [
			...out.stated,
			...reads,
			...out.shortCounts,
			...out.still.map(
				([at, length]) => `still ${length.toFixed(1)} s at ${at.toFixed(1)}`,
			),
		],
		rows: out.rows.map(
			(r) => `${r.show.toFixed(2)} ${r.hold.toFixed(2)} ${r.name} ${r.text}`,
		),
	}),
);
