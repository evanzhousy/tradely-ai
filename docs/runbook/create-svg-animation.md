# Runbook: create a lesson film (SVG animation)

Updated October 5, 2026. Every lesson in the course (53 of them) opens with a short film, then hands the learner to its interactive playground. This runbook explains how those films are built, the rules they follow, how to verify one, and which ideas from outside references we use or plan to use.

## 1. What a lesson film is

- **A motion graphic drawn in the page, not a video file.** Each film is an SVG scene moved by one paused GSAP timeline. Nothing is rendered to MP4, so the film stays sharp at any width, can be scrubbed, follows the page's language and costs about 10–14 kB gzipped per lesson on top of the shared film kit (about 34 kB).
- **A dark, fixed stage.** The film brings its own colours whatever the page theme, so it reads as a video embedded in the lesson.
- **Type-led.** Headlines carry the claims. A chart or table appears only as proof of a claim and leaves when the claim is made.
- **Silent and bilingual.** All on-screen text exists in English and Simplified Chinese; there is no narration or music.
- **Real cuts between shots.** Each shot replaces the last; the film never piles one figure on top of another.
- **Pure autoplay.** The film starts when it is on screen, pauses off screen or in a hidden tab, plays at **2× by default** (1× and 1.5× are offered and the learner's choice is remembered), and can be scrubbed by shot. With reduced motion it shows the end of each shot for as long as the shot would have lasted.
- **Two frames.** 16:9 on wider screens; a portrait 4:5 frame below 520 px, where the film also runs to the lesson card's inner edge. Type is sized to the frame, so text keeps a readable size on a phone.
- **About 40–45 seconds at 1×** (about 20–22 s at the default 2×), in 6–8 shots, with one hero moment at 60–65 % of the runtime. The last film of a module ends on "Next: the module checkpoint". Module checkpoints have no film; they stay quizzes.

## 2. Where things live

| Path | What it holds |
|---|---|
| `apps/web/src/features/learning/walkthrough/film.tsx` | The `Film` type and `FilmStage`, which draws a film at its column width and rebuilds the timeline on resize |
| `apps/web/src/features/learning/walkthrough/film-kit.tsx` | The shared grammar: `filmFrame`, `Lines`, `Word`, `lineCount`, `Backdrop`, `Hatch`, `TitleCard`, `EndCard`, `PenTip`, `Brackets`, `createDirector` |
| `apps/web/src/features/learning/walkthrough/text-measure.ts` | Text widths and line breaking (`textWidth`, `tokenize`, `wrapText`), shared with the lessons' static diagrams |
| `apps/web/src/features/learning/walkthrough/player.tsx` | `Player`: the film, its scrubber and speed control, then the playground scenes |
| `apps/web/src/styles/walkthrough.css` | Film classes (`wt-film-*`), line and band classes, the dark stage tokens, the phone full-bleed rule |
| `apps/web/src/features/learning/lessons/<id>.tsx` | The lesson: its playground scenes, wired to `<Player film={...}>` |
| `apps/web/src/features/learning/lessons/<id>-film.tsx` | The lesson's film |
| `apps/web/src/features/learning/lessons/<id>-model.ts` | The numbers and helpers the film and the playground share |
| `apps/web/src/features/learning/visual-lesson.tsx` | The lazy registry that maps a lesson id to its component |
| `apps/web/src/content/syllabus.ts` | Lesson order and titles; the source for every film's "Next:" card |
| `apps/web/src/content/world/` | The shared teaching world (ALFA, its chain, Monday's trades, quotes) and the formatters `usd(cents)`, `signedUsd(cents)`, `count`, `pick`, and the `Copy` type |

## 3. How to make a film, step by step

1. **Read the lesson.** List its scenes, captions, predict questions and explore tasks. Write down the three claims the lesson teaches and the question a learner would ask before seeing them.
2. **Extract the model.** Move every constant and helper the film will reuse (quotes, trades, payoff functions, formatting helpers) from `<id>.tsx` into `<id>-model.ts`, export them, and import them back into the lesson. Target module-level definitions only; a view may hold a same-named local. Run the type check: it reports the imports the lesson no longer needs. The film and the playground must show the same numbers.
3. **Write the treatment** as the film's header comment: one paragraph telling the story, then a shot table with times, and name the hero moment (section 4). Times are authoring times, written on a 4 s title card (see section 4). Example:

   ```
   *   open      0–4      "Counterparties"
   *   question  4–9.5    Ben offers 10 at $4.10, you buy them: volume +10 or +20?
   *   match     9.5–20   resting; incoming; one trade, one print, volume +10
   *   limit     20–30.5  buy 30, limit $4.15; 10 and 12 fill; 8 rest as your bid
   *   print     30.5–39.5 the tape; record A, market; record B, limit; cut: the claim
   *   next      39.5–42  Next: execution side
   ```

4. **Lay out the frame.** Write `layout(width)` on top of `filmFrame(width)`. Return every position the film needs as numbers or small functions (`rowY(i)`, `x(spot)`, `y(dollars)`). `Scene` and `build` both call it, so a mark and its tween always agree. Branch on `narrow` for the phone frame.
5. **Write the copy.** One `copy` object of `Copy` tuples (`[en, zh]`), typed `as const satisfies Record<string, Copy>`. Every headline has a short variant for the phone (`m0` and `m0Short`). Add the closing claim (`claimBig`, `claimSub`), the next card (`nextBig`, `nextSub`) and the film's `label`, a full description of the film for screen readers in both languages.
6. **Draw the Scene.** Draw every mark the film will ever show, at rest, in its final position. Give each mark that moves a unique `data-f` name. Charts that the camera moves live in `<g data-f="depth"><g data-f="world">…</g></g>`.
7. **Build the timeline.** Create the director, hide everything that enters later with `d.hidden([...])`, then add one label per shot (`tl.addLabel("match", 9.5)`) and schedule the moves. The shot ids in `shots` must match the labels.
8. **Export and wire it.** Export the `Film` from `<id>-film.tsx` and pass it to the lesson's `<Player film={...} scenes={scenes} />`.
9. **Verify** (section 7), then **commit** the lesson, its film and its model in one commit.

### A film's skeleton

```tsx
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop, createDirector, EndCard, filmFrame, Lines, TitleCard,
} from "../walkthrough/film-kit";
// Numbers come from the lesson's model: import { ASK, BID } from "./example-model";

const END = 42;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow } = frame;
	return { ...frame, rowY: (i: number) => H * (narrow ? 0.27 : 0.28) + i * H * 0.07 };
}

const copy = {
	title: ["Example", "示例"],
	titleSub: ["what the lesson is about", "这一课讲什么"],
	h0: ["The full headline for a wide frame.", "宽画面上的完整标题。"],
	h0Short: ["The short headline.", "短标题。"],
	claimBig: ["The one sentence to remember.", "要记住的一句话。"],
	claimSub: ["Why it holds, in one line.", "为什么成立，一句话。"],
	nextBig: ["Next: the next lesson", "下一课：下一课"],
	nextSub: ["its subtitle", "它的副标题"],
} as const satisfies Record<string, Copy>;

function Scene({ width, locale }: { width: number; height: number; locale: Locale }) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const { type: T, room, narrow, margin } = L;
	return (
		<>
			<Backdrop frame={L} />
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<Lines name="h0" text={t(narrow ? copy.h0Short : copy.h0)} x={margin} y={L.headY}
				size={T.head} maxWidth={narrow ? room : room * 0.74} anchor="start" />
			{/* …every mark at rest, each with its own data-f… */}
			<g data-f="claim">{/* z-big, z-sub */}</g>
			<EndCard frame={L} locale={locale} next={t(copy.nextBig)} why={t(copy.nextSub)} />
		</>
	);
}

function build(context: FilmContext) {
	const L = layout(context.width);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	d.hidden([one("h0"), ...kids("claim")]);
	tl.addLabel("open", 0);
	d.open(0);
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("h0"), 4.6);
	// …one label per shot, then the moves…
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const exampleFilm: Film = {
	id: "example",
	label: ["Example, as a short film: …", "示例短片：……"],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Example", "示例"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
```

## 4. The shot structure

Every film follows the same arc, so a learner always knows where they are.

| Shot | Time (1×) | What happens |
|---|---|---|
| `open` | 0–4 s | The lesson's name wipes on with its subtitle (`d.open`). At 4 s it shrinks into the top-right corner as the film's tag (`d.tag`). Playing, the card lasts 2 s: `d.close` moves everything after 4 s 2 s earlier, so the question arrives at 2 s (1 s at 2×) and the film plays 2 s shorter than its `END`. Keep writing times on the 4 s card. |
| `question` | 4–9.5 s | The question the lesson answers, set big, with the one number or scene that makes it concrete. |
| 3 teaching shots | 9.5–about 40 s | Each shot makes one claim: a headline at the top left, and a chart, table or card below it as proof. Headlines change with `d.swap`; charts rise from the depth (`d.rise`) and sink when the claim is made (`d.sink`). |
| `claim` | about 40–44 s | Cut to big type: the one sentence to remember and why it holds. Hold it at least 3.5 s. |
| `next` | about 44–46.5 s | The end card: the next lesson's name, its subtitle and "Try it in the playground ↓" (`d.close`). |

**The hero moment.** Each film has one visual peak at 60–65 % of its runtime, where the lesson's key number is made rather than stated: the marker walking to break-even while the meter reads $420 and $0, brackets locking on and the profit filling in behind it; a trade leaving the book as a chip and landing as a print. Build it from the kit's `trace`, `lock`, `carry` and `morph`, and give it room: hold the key value at least 2 s at 1× (1 s at the default 2×), then an after-beat (the filled area, the landed print) before the cut. A hero the learner passes through in half a second isn't one.

## 5. Film kit reference

### The frame: `filmFrame(width)`

| Field | Meaning |
|---|---|
| `width`, `height` | 16:9, or 4:5 when `width < 520` |
| `narrow` | True on the phone frame |
| `margin` | The left edge everything aligns to |
| `room` | The widest a line of type may run (84 % of the width) |
| `headY` | The baseline of a top-left headline; on a phone it sits under the corner tag |
| `tagY` | The corner tag's baseline |
| `type.big`, `title`, `head`, `num`, `body`, `small` | The type scale, sized to the frame, with phone minimums |

### Components

| Component | Use |
|---|---|
| `Lines` | Wrapped stage type (headlines, claims). It keeps Chinese words and course terms whole (成交, 权利金, 标的), never separates a number from its measure word ("4 点"), uses as many lines as greedy wrapping would, balances them, and prefers to break after a comma, colon or full stop. Use `lineCount` to place whatever follows it. |
| `Word` | One line that never wraps: a number, a word, a short label |
| `Backdrop` | The stage colour, a drifting grid and a vignette. Always first. |
| `Hatch` | A diagonal hatch pattern for regions no value can reach |
| `TitleCard` | The opening name and subtitle |
| `EndCard` | The closing next card and the call to the playground |
| `PenTip` | A glowing pen tip for `trace`: a bright core in a wide, faint halo. Put it in the same group as the line it leads. |
| `Brackets` | Corner brackets around a box, for `lock`; `tone="gain"` or `"loss"` for a bid or an ask |

### Director moves: `createDirector(context, frame, end)`

| Move | What it does |
|---|---|
| `one(name)`, `kids(name)` | Find a mark by `data-f`, or the children of a named group |
| `hidden(targets)` | Set marks invisible at the start |
| `show(targets, at, from?, duration?)` | Enter from just below, above or right (resets `x`/`y`) |
| `hide(targets, at, duration?)` | Leave up and away |
| `swap(from, to, at)` | Replace one line of type with the next, never both at once: the old one leaves upwards and the new one comes up from below, clear of the corner tag on a phone. Enter a shot's first headline with the default `show` too, not `"above"`. |
| `pop(target, at)` | A chip lands with a little overshoot |
| `slam(target, at)` | A headline number lands large and settles, the film's loudest move |
| `flip(from, to, at)` | One value folds shut and the next opens; follow it with `tl.set(from, { opacity: 0 }, at + 0.3)` |
| `count(target, to, at, format, from, duration)` | A figure counts from `from` to `to` |
| `trace(path, at, { tip, duration, ease })` | A line draws itself from its start; with a `PenTip` the tip leads it and goes out at the end. Dashed lines get their dashes back. |
| `lock(brackets, at)` | `Brackets` snap from 1.4× to 1× onto the thing in focus |
| `carry(from, to, at, duration)` | `from` moves and scales onto `to`'s box, then hands over to it: the question's number flying into its row, a trade into the tape. Both must be untransformed at that moment. |
| `morph(path, d, at, duration)` | A path becomes another with the same commands (draw both through the same points, e.g. with one `path(f)` helper): value into profit, a written put into a written call |
| `rise(at)`, `sink(at)` | The chart layer (`depth`) rises into view or sinks away |
| `cam(scale, focus, target)`, `home` | Camera props for the `world` group: scale about the chart so `focus` lands on `target` |
| `open(at)`, `tag(at)`, `close(at)` | The title wipe, the title shrinking to the corner tag, the end card |

### Colours mean something

| Class | Meaning |
|---|---|
| `wt-film-gain`, `data-tone="gain"` | Gain, a buyer, a pass |
| `wt-film-loss`, `data-tone="loss"` | Loss, a seller, a failure, something removed |
| `wt-film-accent`, `data-tone="total"` | The figure the shot is about |
| `wt-film-warn` | Caution, an inference, a value that depends on something unknown |
| `wt-film-dim`, `data-tone="neutral"` | Context and secondary detail |
| `wt-film-tag` | Small capitals for labels and axes |
| `wt-film-link`, `wt-film-riser`, `wt-film-ghost` | Dashed guides, accent rules, the outline of something missing |
| `wt-line-position`, `-long`, `-short`, `-reference` | Payoff and profit lines: the position, a long leg, a short leg, a reference |
| `wt-panel-shape`, `wt-focus-shape` | A card at rest, and the card in focus |

Never use a colour as decoration: a learner reads green as gain and red as loss everywhere in the course.

## 6. Design rules

**Type and layout**
- A headline sits at `L.headY`, left-aligned at `margin`, with `maxWidth: room * 0.74` on the wide frame so it never meets the corner tag. On a phone it uses its short variant and the full `room`.
- One idea per headline, about 8–10 words on the wide frame. At the default 2× a headline is read in half its hold, so hold each one at least 2.6 s at 1× and put the numbers on the stage rather than in the sentence. If it doesn't fit two lines, shorten it.
- Tape notation (`10 @ $4.10`) belongs on tapes and tickets, never in a headline. In a sentence, write "10 at $4.10" or "10 张 $4.10".
- Keep text off the frame edges: anchor the last tick label of an axis to its end, and leave a right margin on the phone for labels near the edge.
- On a phone, prefer short labels and stacked layouts over shrinking type below the frame's minimums.

**Motion**
- One thing moves at a time; stagger a group by 0.1–0.3 s.
- Numbers, bars and lines never overshoot: data lands exactly, a big figure included (`power3.out`). Overshoot (`pop`, `slam`) is for chips and tags only.
- Carry, don't cut, where an element has somewhere to go: the question's numbers fly to their places in the first teaching shot; a trade flies from the book to the tape. Route a carry so it never crosses a figure the learner is reading.
- Lines draw on with `getTotalLength()` dash drawing, or are revealed by a clip rectangle that starts at width 0.
- Cut to big type rather than overlaying a claim on a chart.
- Every count names its `from`, so scrubbing backwards never jumps.

**Honesty**
- Every number on screen comes from the lesson's model. If the film needs a new figure, add it to the model so the playground shows the same one.
- Say what is calculated, what is inferred and what is unknown. A missing value is shown as missing, never as zero: an emptied offer reads "—".
- Numbers carry across shots. A trade never un-happens: its print stays on the tape, and a size that changed in one shot starts the next shot at its new value. A readout tied to a moving marker is computed from the marker's own position every frame, never counted on a separate tween.
- The film's claims must match the lesson's captions and explanations in both languages.

**Copy**
- English verbs agree with their subject ("You buy", "Eli buys").
- Chinese copy is idiomatic, with full-width punctuation; numbers and tickers stay half-width.
- The next card names the next lesson in syllabus order; the last lesson of a module says "Next: the module checkpoint" / "下一步：模块检查点".

## 7. Verify a film

The repository forbids unit tests. Verify with type checks, lint, a build and browser checks, and keep every report, screenshot and GIF outside the repository.

1. **Static checks**
   ```bash
   # from the repository root
   (cd apps/web && npx tsc --noEmit)
   npx biome check --write apps/web/src/features/learning/lessons/<id>*
   ```
2. **Run a dev server you own.** Another long-running server on the default port can hang during an audit:
   ```bash
   cd apps/web && npx vite dev --port 8262 --strictPort
   ```
3. **Scan every half second** at 1440×900 and at 390×844 (device scale 2, mobile), in English and in Chinese. In development the player exposes the timeline as `window.__tradelyFilm`, so a headless browser can pause it, seek to each time, take a screenshot of `.wt-film`, and run these checks in the page:

   ```js
   // Seek. Wait about 70 ms before measuring.
   const tl = window.__tradelyFilm; tl.pause(); tl.seek(t, false);

   // Text past the frame (ignoring the camera's world group).
   const svg = document.querySelector(".wt-film-svg");
   const box = svg.getBoundingClientRect();
   const visible = (el) => { for (let e = el; e && e !== svg; e = e.parentElement)
     if (Number(getComputedStyle(e).opacity) < 0.05) return false; return true; };
   const spills = [...svg.querySelectorAll("text")]
     .filter((t) => t.textContent.trim() && visible(t) && !t.closest('[data-f="world"]'))
     .filter((t) => { const r = t.getBoundingClientRect(); return r.width &&
       (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1); });

   // Settled text (opacity > 0.6) whose glyph boxes cross another's: trim 18 % off the top and
   // bottom of each line box, and flag pairs that overlap by more than 2 × 3 px.
   ```

   Also record console errors. A film passes when every size and language reports no errors, no spills and no overlaps. Sample the hero moves again every 0.1 s: a carry can cross a label between two half-second frames.
4. **Read the frames yourself.** The scan ignores text inside the camera's world group, so look at contact sheets of the 1440 English and 390 Chinese frames for labels crossing a curve, labels clipped at a plot edge, wrong numbers and awkward copy.
5. **Play it for real.** Load the lesson with no saved speed, let the film autoplay, and confirm the speed button reads 2×, the player reaches `data-ended` in about half the film's length, "Try the playground" opens the playground (`data-player-mode="play"`), and every playground scene opens without console errors. Radix tabs need real pointer events in automation.
6. **Build.** `pnpm build` in `apps/web`.
7. **Make the GIF evidence** from the 1440 English frames and link it in the report:
   ```bash
   ffmpeg -framerate 4 -i frames/1440-en-%03d.png \
     -vf "scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer" film.gif
   ```
8. **Commit** the lesson, its film and its model together, one commit per lesson, with only those files staged.

**When you change the kit's type** (`Lines`, `wrapText`), every film is affected. Before committing, dump each film's line breaks (every multi-line `text[data-f]` and its `tspan`s) at 1440 and 390 in both languages with the old kit and with the new one, compare, and scan in full every film whose line count changed.

## 8. Mistakes we have already made

- **Names must be unique.** `one()` returns the first match, so a group and a text that share a `data-f` name break each other.
- **Hide named groups whole.** When a helper expands groups to hide their children, expand only unnamed groups (`el.tagName === "g" && !el.hasAttribute("data-f")`); hiding the children of a named group and later showing the group reveals nothing.
- **`show()` resets `x` and `y`.** Rows positioned with a `y` transform (rows that reorder) enter through a custom `tl.fromTo(row, { opacity: 0, x: 18 }, { opacity: 1, x: 0 })`.
- **Scale only single text elements.** GSAP scales an SVG `<g>` about its box corner and lifts it off its baseline.
- **Dashed lines lose their dashes when drawn on.** Dash drawing overwrites `strokeDasharray`; set the dash pattern back when the draw finishes. A round-capped line drawn by dash must start at opacity 0, or its caps show as dots.
- **Resets must be tweens, not `tl.set` of `textContent`.** To return a counter to an earlier value, count back with explicit `from` and `to`, so scrubbing in either direction shows the right number.
- **Cents and dollars.** `usd()` and `signedUsd()` take cents. One film showed $0.05 − $0.03 for $5.25 − $3.25 because a model value already in cents was divided by 100 again.
- **Model extraction by script must assert every replacement.** Biome reformats lines after each save, so an edit that silently matches nothing leaves the file half-changed.
- **Keys must not be copy.** The player once keyed its reserved captions by prompt text; two scenes with the same prompt gave React duplicate keys. Key by id.
- **The phone frame is not a scaled desktop.** Each film needs its own phone choices: short labels, stacked layouts, labels anchored away from curves and edges.
- **The wide frame is the player's width, not the window's.** At a 1440 window the film is about 900 px wide, so type clamped to its minimums takes a larger share of the frame. A meter placed under a two-line headline met the chart's caption; place stacked blocks from `lineCount` and the type sizes, not from fractions of the height alone.
- **A single-number dash array merges into a dashed line's own pattern.** Drawing a `5 4` dashed line with `strokeDasharray: length` gave `736px, 4px`, and the whole line showed ahead of the pen. Give dash and gap both: `` `${length} ${length}` `` (the kit's `trace` does).
- **Film colours change on the timeline.** The diagrams' 0.3 s CSS colour transition made a scrubbed frame show a colour on its way; film marks take no CSS transition, so a class or fill set at a time is that colour at that time.
- **A carry's path can cross what the learner is reading.** A print flying from venue C to a strip under the NBBO crossed the NBBO figure; the strip moved under C. Start a carry clear of other marks and land it on the matching text.
- **A `fromTo` renders its start at build time.** A tween whose `onUpdate` writes a meter or moves a marker will write its start state the moment it is created, so a later walk overwrote an earlier one's readout before either began. Give such tweens `immediateRender: false`.

## 9. Style direction: what we take from motion-design references

In October 2026 we reviewed [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT), fifteen 10-second motion-design styles, each made by an AI from one prompt. Its films are rendered to MP4 with synthesised sound, so its pipeline does not apply to us, but several techniques and its review process do.

**Status:** "In use" is in the film kit today. "Piloted" is built and used in premium-payoff and quotes-orders-trades (October 5, 2026), not yet rolled out to the other films. "Planned" is agreed direction, not yet built.

| Source style | What we take | Where | Status |
|---|---|---|---|
| Sticker explainer (回形针 / 林超) | Exact charts, count-ups, every beat bringing a new element | All films | In use |
| Sticker explainer | One large canvas with continuous camera moves instead of cuts; labels on leader lines; a closing card built on one huge number | Chart-heavy shots | Planned |
| Sticker explainer | Real product screens as white-outlined "stickers" on one canvas | Workflow lessons | Planned |
| Line art | A line that draws itself behind a softly glowing pen tip (`trace`, `PenTip`), older lines dimming, then an area filling (the profit area growing behind the break-even marker) | Payoff and profit curves | Piloted |
| Shape morph | One shape becoming the next (`morph`): the value line dropping by the premium into the profit line, a written put becoming a written call | Payoff lines | Piloted |
| Flat vector | Element-driven transitions (`carry`): the question's numbers flying into the book, a trade flying from the book to the tape | Shot changes | Piloted |
| Flat vector, Bauhaus | One thing moves at a time; data never overshoots | All films | In use |
| HUD | Corner brackets that snap from 1.4× to 1.0× onto the thing in focus (`lock`, `Brackets`) | Break-even, the level a trade takes, the best bid and ask | Piloted |
| Synthwave / VHS | A double glow (tight plus wide) on one hero element only | The pen tip | Piloted |
| Liquid | A gooey merge (SVG blur plus alpha threshold), used once | Four prints merging into one package | Optional |
| Aurora glass | 3–5 % noise over dark gradients to prevent banding | The backdrop | Not needed: the backdrop is one flat colour and the vignette fades to it, so nothing bands |
| Isometric | An isometric pipeline with parallax slides | Workflow module overview | Optional |

**Not for this course:** frame-by-frame line boil, collage, pixel art, variety captions and synthwave as a whole look (wrong tone for teaching risk, or jerky steps that fight scrubbing); 3D render, liquid and aurora glass as whole looks (they need Blender or WebGL, heavy inside a lesson on a phone); flat-vector and isometric illustration as a house style (decorative art at 53× the cost, and bright colours that collide with gain and loss). The HUD look in particular reads as prediction, which contradicts what the course teaches.

**Craft rules from the same source**
- **Hook in the first 0.5 s.** The title card now lasts 2 s (1 s at 2×); the name wipes on from the first frame.
- **One hero moment at 60–75 % of the runtime.** Piloted at 60–65 % (section 4); name it in the treatment.
- **Transitions carried by elements, not crossfades.** Piloted with `carry` and `morph`.
- **Key frames as poster-worthy stills** and **every frame a pure function of time**: in use.

**Before rolling the pilots' pattern out**, the October 5 jury (premium-payoff 5.3 → 6.4, quotes 4.9 → 6.0) asked for: carry that lands on the matching text inside its target and never starts on another mark; a mirror or flip helper, since a straight morph between two payoffs passes through shapes nobody holds; brackets sized to their content plus padding at 390 px; an English line-break penalty for ending on "a", "the", "at", "of" or "to"; phone headlines that leave without lifting into the corner tag; and a scan that also checks text against lines and edges inside the camera's world group.

**Review by an independent jury (in use).** After a film passes section 7, give a separate AI session its frames (a contact sheet every 0.5 s, plus full frames at the key moments) and ask it to judge harshly, score 1–10 on the dimensions below (5 = competent student work, 7 = solid professional, 8 = high-end agency, 9 = award shortlist), and list 5–10 fixes ordered by impact, each with times, what is wrong, why it matters and a concrete fix. Apply the fixes, then review once more.

| Dimension | What the jury checks |
|---|---|
| numerical_accuracy | Every figure matches the model and the lesson; units, signs and rounding are right |
| teaching_clarity | One claim per shot; the question, the proof and the claim are easy to follow at 2× |
| house_style | Dark stage, type-led, colour meanings kept, no decoration |
| motion_craft | Easing, staggering, one thing moving at a time, no dead spans, no jumps when scrubbed |
| design_typography | Hierarchy, alignment, negative space, CJK setting |
| phone_legibility | The 4:5 frame reads on its own terms |
| technical | No console errors, no spills, no overlaps, no clipped labels |

## 10. Checklist

- [ ] Lesson read; three claims and the opening question written down
- [ ] `<id>-model.ts` holds every shared number; the lesson imports it; no unused imports
- [ ] Treatment and shot table at the top of `<id>-film.tsx`; shot ids match the timeline labels
- [ ] Every headline has a phone variant; copy is idiomatic in both languages; no tape notation in headlines
- [ ] Every moving mark has a unique `data-f`; counts name their `from`
- [ ] Colours follow their meanings; data never overshoots
- [ ] One hero moment at 60–65 %, named in the treatment; headlines held at least 2.6 s, the claim at least 3.5 s
- [ ] Numbers carry across shots; nothing that happened un-happens
- [ ] Next card matches the syllabus (or "the module checkpoint")
- [ ] `tsc` and `biome` clean
- [ ] Scan clean at 1440 and 390, English and Chinese; frames read by eye
- [ ] Real playback reaches the end at 2× and opens the playground; no console errors
- [ ] `pnpm build` passes
- [ ] GIF made outside the repository and linked
- [ ] One commit with only the lesson, film and model files
