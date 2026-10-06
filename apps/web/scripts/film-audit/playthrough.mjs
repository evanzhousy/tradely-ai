// One page of the film audit (run by film-audit.sh in ego-browser). Plays each lesson's film in
// real time at the default rate and reports: the rate, the time to the end, errors, whether
// the playground opens, the timeline sampled against the wall clock (speed, stalls), and frame
// times (p95 and frames over 50 ms). THROTTLE slows the CPU (4 = a mid-range phone).
// env: SPACE, LIST, SIZE, LOCALE, PORT, THROTTLE
const task = await taskSpace(Number(env.SPACE));
const page = task.page("p1");
const fs = await import("node:fs/promises");
const lessons = (await fs.readFile(env.LIST, "utf8"))
	.split("\n")
	.filter(Boolean);
const [w, h, dpr] = env.SIZE.replace("m", "").split("x").map(Number);
await page.cdp("Emulation.setDeviceMetricsOverride", {
	width: w,
	height: h,
	deviceScaleFactor: dpr,
	mobile: env.SIZE.endsWith("m"),
});
await page.cdp("Emulation.setCPUThrottlingRate", {
	rate: Number(env.THROTTLE || 1),
});
for (const lesson of lessons) {
	const started = Date.now();
	const r = { lesson };
	try {
		await page.goto(`http://localhost:${env.PORT}/learn/${lesson}`);
		await page.evaluate((loc) => {
			localStorage.setItem("tradely.locale", loc);
			// biome-ignore lint/suspicious/noDocumentCookie: the page sets the app's locale cookie, as its switcher does
			document.cookie = `tradely.locale=${loc}; Path=/; Max-Age=31536000; SameSite=Lax`;
			localStorage.removeItem("tradely:player-rate:v1");
			localStorage.removeItem("tradely:visual-scenes:v1");
		}, env.LOCALE);
		await page.reload();
		await page.evaluate(() => {
			window.__errors = [];
			window.addEventListener("error", (e) =>
				window.__errors.push(String(e.message)),
			);
			const o = console.error;
			console.error = (...a) => {
				window.__errors.push(a.map(String).join(" ").slice(0, 160));
				o(...a);
			};
		});
		await page.waitForSelector("loc=css:.wt-film-svg", {
			state: "visible",
			timeout: 90000,
		});
		await page.evaluate(() => {
			const el = document.querySelector(".wt-player");
			window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
		});
		r.rate = await page.evaluate(
			() => document.querySelector(".wt-rate")?.textContent,
		);
		// Sample the timeline against the wall clock: a slow run is either a slow rate or stalls.
		await page.evaluate(() => {
			window.__pt = [];
			window.__frames = [];
			let last = performance.now();
			const frame = (now) => {
				window.__frames.push(now - last);
				last = now;
				if (window.__frames.length < 20000)
					window.__raf = requestAnimationFrame(frame);
			};
			window.__raf = requestAnimationFrame(frame);
			const t0 = performance.now();
			window.__ptTimer = setInterval(() => {
				const tl = window.__tradelyFilm;
				if (tl)
					window.__pt.push([
						Math.round(performance.now() - t0),
						Math.round(tl.time() * 100) / 100,
						document.visibilityState,
					]);
			}, 500);
		});
		const t0 = Date.now();
		await page.waitForFunction(
			() => !!document.querySelector(".wt-player")?.dataset.ended,
			undefined,
			{ timeout: 70000 },
		);
		r.playSeconds = Math.round((Date.now() - t0) / 100) / 10;
		r.duration = await page.evaluate(() => window.__tradelyFilm?.duration());
		const pts = await page.evaluate(() => {
			clearInterval(window.__ptTimer);
			return window.__pt;
		});
		const frames = await page.evaluate(() => {
			cancelAnimationFrame(window.__raf);
			return window.__frames.slice(1);
		});
		if (frames.length) {
			const sorted = [...frames].sort((a, b) => a - b);
			r.p95 = Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10;
			r.longFrames = frames.filter((f) => f > 50).length;
		}
		if (pts.length > 2) {
			const first = pts.find((q) => q[1] > 0.5) || pts[0];
			const lastP = pts[pts.length - 1];
			r.speed =
				Math.round(
					((lastP[1] - first[1]) / ((lastP[0] - first[0]) / 1000)) * 100,
				) / 100;
			let stall = 0;
			for (let i = 1; i < pts.length; i++)
				if (pts[i][1] === pts[i - 1][1] && pts[i][1] < r.duration - 0.1)
					stall += 0.5;
			r.stalled = stall;
			r.stallsAt = pts
				.filter(
					(q, i) => i && q[1] === pts[i - 1][1] && q[1] < r.duration - 0.1,
				)
				.map((q) => q[1]);
			r.startDelay = Math.round(first[0] / 100) / 10;
			r.hidden = pts.some((q) => q[2] !== "visible");
		}
		await page.click(
			`text=${env.LOCALE === "zh" ? "进入探索区" : "Try the playground"}`,
			{ label: "open the playground" },
		);
		await page.waitForSelector("loc=css:.wt-player[data-player-mode='play']", {
			state: "visible",
			timeout: 8000,
		});
		r.playground = true;
		r.errors = await page.evaluate(() => window.__errors);
	} catch (e) {
		r.fail = String(e.message || e).slice(0, 120);
		try {
			r.state = await page.evaluate(() => {
				const tl = window.__tradelyFilm;
				return (
					tl && {
						t: Math.round(tl.time() * 10) / 10,
						paused: tl.paused(),
						ts: tl.timeScale(),
						mode: document.querySelector(".wt-player")?.dataset.playerMode,
					}
				);
			});
		} catch {}
		try {
			r.errors = await page.evaluate(() => window.__errors);
		} catch {}
	}
	r.total = Math.round((Date.now() - started) / 1000);
	console.log(JSON.stringify(r));
}
await page.cdp("Emulation.setCPUThrottlingRate", { rate: 1 });
await page.cdp("Emulation.setDeviceMetricsOverride", {
	width: 1440,
	height: 900,
	deviceScaleFactor: 1,
	mobile: false,
});
