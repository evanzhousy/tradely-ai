// One page of the share cards (run by film-audit.sh in ego-browser): for each lesson, the film at
// its hero lock beside the lesson's title, as a 1200×630 card for link previews. A film's
// hero-lock label marks its one key moment, so no frame is chosen by hand.
// env: SPACE, LESSONS (one a line), OUT, PORT, SITE_TITLE, SITE_FILM
const fs = await import("node:fs/promises");
const task = await taskSpace(Number(env.SPACE));
const page = task.page("p1");
const lessons = env.LESSONS.split("\n").filter(Boolean);

const metrics = (width, height, deviceScaleFactor) =>
	page.cdp("Emulation.setDeviceMetricsOverride", {
		width,
		height,
		deviceScaleFactor,
		mobile: false,
	});

/** The film at its hero, seen from a lesson page. Returns the lesson's title. */
async function captureFilm(lesson, path) {
	await metrics(1440, 900, 2);
	await page.goto(`http://localhost:${env.PORT}/learn/${lesson}`);
	await page.evaluate(() => {
		localStorage.setItem("tradely.locale", "en");
		// biome-ignore lint/suspicious/noDocumentCookie: the page sets the app's locale cookie, as its switcher does
		document.cookie =
			"tradely.locale=en; Path=/; Max-Age=31536000; SameSite=Lax";
		localStorage.setItem("theme", "light");
	});
	await page.reload();
	await page.waitForSelector("loc=css:.wt-film-svg", {
		state: "visible",
		timeout: 90000,
	});
	await page.waitForTimeout(1500);
	await page.evaluate(() =>
		document.querySelector('[data-nav="play"]').click(),
	);
	const found = await page.evaluate(() => {
		const el = document.querySelector(".wt-player");
		window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
		const tl = window.__tradelyFilm;
		const hero = tl.labels["hero-lock"];
		if (hero === undefined) return null;
		tl.pause();
		// The lock's glow is at full strength within 0.5 s of its label and holds at least 1 s.
		tl.seek(hero + 0.9, false);
		const b = document.querySelector(".wt-film").getBoundingClientRect();
		return {
			title: document.title.replace(/ \| Tradely$/, ""),
			hero,
			clip: {
				// Inside the frame's edges, so no page shows at a fractional one.
				x: Math.ceil(b.left),
				y: Math.ceil(b.top + window.scrollY),
				width: Math.floor(b.width) - 1,
				height: Math.floor(b.height) - 1,
			},
		};
	});
	if (!found) return null;
	await page.waitForTimeout(120);
	await page.screenshot({ path, clip: found.clip });
	return found;
}

/** Lays the frame and the title over the page, where the site's own fonts have loaded. */
async function compose(title, filmPath, outPath) {
	const film = (await fs.readFile(filmPath)).toString("base64");
	await page.evaluate(
		({ title, film }) => {
			document.getElementById("share-card")?.remove();
			const card = document.createElement("div");
			card.id = "share-card";
			card.style.cssText =
				"position:fixed;inset:0;z-index:2147483647;display:grid;grid-template-columns:326px 1fr;align-items:center;gap:32px;padding:40px;background:#0d1017;color:#f3f4f7;font-family:var(--font-heading)";
			const left = document.createElement("div");
			left.style.cssText =
				"display:flex;flex-direction:column;justify-content:space-between;align-self:stretch;min-width:0";
			const brand = document.createElement("div");
			brand.style.cssText =
				"display:flex;align-items:center;gap:12px;font-size:26px;font-weight:600";
			const mark = document.createElement("img");
			mark.src = "/brand/tradely-mark.png";
			mark.style.cssText = "width:48px;height:48px";
			brand.append(mark, "Tradely");
			const heading = document.createElement("p");
			heading.textContent = title;
			const size = title.length <= 28 ? 46 : title.length <= 48 ? 40 : 34;
			heading.style.cssText = `margin:0;font-size:${size}px;line-height:1.14;font-weight:600;letter-spacing:-0.01em;text-wrap:balance`;
			const foot = document.createElement("p");
			foot.textContent = "Free lessons · tradely.ai";
			foot.style.cssText = "margin:0;font-size:20px;color:#a2a6b4";
			left.append(brand, heading, foot);
			const image = document.createElement("img");
			image.src = `data:image/png;base64,${film}`;
			image.style.cssText =
				"width:100%;border-radius:18px;border:1px solid #2a2f3b;display:block";
			card.append(left, image);
			document.body.append(card);
			return Promise.all(
				[image, mark].map((i) =>
					i.complete
						? null
						: new Promise((done) => {
								i.onload = done;
							}),
				),
			);
		},
		{ title, film },
	);
	await metrics(1200, 630, 1);
	await page.waitForTimeout(200);
	await page.screenshot({ path: outPath });
}

for (const lesson of lessons) {
	const started = Date.now();
	const filmPath = `${env.OUT}/film-${lesson}.png`;
	try {
		const found = await captureFilm(lesson, filmPath);
		if (!found) {
			console.log(JSON.stringify({ lesson, error: "no hero-lock label" }));
			continue;
		}
		await compose(found.title, filmPath, `${env.OUT}/${lesson}.png`);
		console.log(
			JSON.stringify({
				lesson,
				title: found.title,
				hero: found.hero,
				ms: Date.now() - started,
			}),
		);
	} catch (error) {
		console.log(JSON.stringify({ lesson, error: String(error).slice(0, 200) }));
	}
}

// The card for every other page: the course's own line beside one film's hero.
if (env.SITE_TITLE) {
	const filmPath = `${env.OUT}/film-${env.SITE_FILM}.png`;
	await captureFilm(env.SITE_FILM, filmPath);
	await compose(env.SITE_TITLE, filmPath, `${env.OUT}/tradely.png`);
	console.log(JSON.stringify({ lesson: "tradely", title: env.SITE_TITLE }));
}
