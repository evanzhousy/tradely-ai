# Runbook: create a lesson film (SVG animation)

Updated October 16, 2026. Every lesson in the course (53 of them) opens with a short film, then hands the learner to its interactive playground. This runbook explains how those films are built, the rules they follow, how to verify one, and which ideas from outside references we use or plan to use.

## 1. What a lesson film is

- **A motion graphic drawn in the page, not a video file.** Each film is an SVG scene moved by one paused GSAP timeline. Nothing is rendered to MP4, so the film stays sharp at any width, can be scrubbed, follows the page's language and costs about 10–14 kB gzipped per lesson on top of the shared film kit (about 34 kB).
- **A dark, fixed stage.** The film brings its own colours whatever the page theme, so it reads as a video embedded in the lesson.
- **Type-led.** Headlines carry the claims. A chart or table appears only as proof of a claim and leaves when the claim is made.
- **Silent and bilingual.** All on-screen text exists in English and Simplified Chinese; there is no narration or music.
- **Real cuts between shots.** Each shot replaces the last; the film never piles one figure on top of another.
- **Pure autoplay.** The film starts when it is on screen, pauses off screen or in a hidden tab, plays at **1.5× by default** (1× and 2× are offered and the learner's choice is remembered; until October 16, 2026 the default was 2×), and can be scrubbed by shot. With reduced motion it shows the end of each shot for as long as the shot would have lasted.
- **Two frames.** 16:9 on wider screens; a portrait 4:5 frame below 520 px, where the film also runs to the lesson card's inner edge. Type is sized to the frame, so text keeps a readable size on a phone.
- **About 40–45 seconds at 1×** (about 27–30 s at the default 1.5×), in 6–8 shots, with one hero moment at 55–65 % of the runtime. The last film of a module ends on "Next: the module checkpoint". Module checkpoints have no film; they stay quizzes.

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
| `open` | 0–4 s | The lesson's name wipes on with its subtitle (`d.open`). At 4 s it shrinks into the top-right corner as the film's tag (`d.tag`). Playing, the card lasts 2 s: `d.close` moves everything after 4 s 2 s earlier, so the question arrives at 2 s (about 1.3 s at the default 1.5×) and the film plays 2 s shorter than its `END`. Keep writing times on the 4 s card. |
| `question` | 4–about 9 s | The question the lesson answers, set big, with the one number or scene that makes it concrete. Hold its line at least 3.5 s. |
| 2–3 teaching shots | about 9–40 s | Each shot makes one claim: a headline at the top left, and a chart, table or card below it as proof. Headlines change with `d.swap`; charts rise from the depth (`d.rise`) and sink when the claim is made (`d.sink`). |
| `claim` | about 40–44 s | Cut to big type: the one sentence to remember and why it holds. Hold it at least 4 s; the line under it is at most 9 words, or held 4.5 s. |
| `next` | about 44–46.5 s | The end card: the next lesson's name, its subtitle and "Try it in the playground ↓" (`d.close`). The three lines come in 0.35 s apart; when `END` is less than 2 s after `d.close`, closer (down to 0.2 s), so the last has settled 0.4 s before the end wherever that fits. Give the end card 2.5 s where the runtime allows (`END` = close + 2.5); at the 45.5 s cap, never under 1.6 s. |

At most seven beats (one headline each) and about 45 s played (`END` about 47). Hold every headline at least 3.5 s at 1×. To shorten a film, merge or cut beats; never shorten the holds.

**The hero moment.** Each film has one visual peak at 55–65 % of its runtime, where the lesson's key number is made rather than stated: the marker walking to break-even while the meter reads $420 and $0, brackets locking on and the profit filling in behind it; a trade leaving the book as a chip and landing as a print. Build it from the kit's `trace`, `lock`, `carry` and `morph`, and give it room: hold the key value at least 2 s at 1× (about 1.3 s at the default 1.5×), then an after-beat (the filled area, the landed print) before the cut. The hero's figure is the loudest mark on screen, at least 1.3 times any meter figure. Stagger its payoff about 0.4 s a step (land, then count, then turn over only what changed, then lock), never four changes inside 0.3 s. Mark the moment the hero's brackets lock with `tl.addLabel("hero-lock", t)`; the timing audit measures it. A hero the learner passes through in half a second isn't one: from the glow at full strength, nothing the brackets hold moves, fades or is carried away for at least 1.5 s at 1×. While the hero shows (above 0.25), nothing that was not already inside its brackets comes into them: not a label, not a bar, not an axis drawn across it. A hairline zero line drawn through a fading hero cost a review score; let the hero go first, then draw what follows. **The hero is frozen:** while it stands, nothing else on the stage moves either, no secondary pulse, no count, no camera move; the after-beat comes after the stand. (The kit's grid keeps drifting through the stand; whether it should pause is an open decision, section 9.)

**Made, not stated.** A headline's figure appears no earlier than the event that makes it. When the answer is the hero's, split the headline: the question half goes up with the beat ("Profit doesn't start at $100."), the answer half appears as a second line under it, at the lock ("It starts at $104.20."). A second half is a headline too: hold it 3.5 s.

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
| `PenTip` | A glowing pen tip for `trace`: a bright core in a wide, faint halo, in its line's role (`tone`, or `color` for a line without one). Put it in the same group as the line it leads. A pen that changes role mid-film switches with `tl.set(pen, { attr: { "data-pen": tone } })`: GSAP resolves a tweened `--pen` to a literal colour, which the audit fails and a backward seek would restore. |
| `Brackets` | Corner brackets around a box, for `lock`: in focus by default, or in the colour of a figure the shot reads by its sign or right (`tone` `"gain"`, `"loss"`, `"call"`, `"put"`, `"caution"`); `glow` for the hero's, in the brackets' own colour |

### Director moves: `createDirector(context, frame, end)`

| Move | What it does |
|---|---|
| `one(name)`, `kids(name)` | Find a mark by `data-f`, or the children of a named group |
| `hidden(targets)` | Set marks invisible at the start |
| `show(targets, at, from?, duration?)` | Enter from just below, above or right (resets `x`/`y`) |
| `hide(targets, at, duration?)` | Leave up and away |
| `swap(from, to, at)` | Replace one line of type with the next, never both at once: the old one leaves upwards and the new one comes up from below, clear of the corner tag on a phone. Enter a shot's first headline with the default `show` too, not `"above"`. |
| `pop(target, at)` | A chip lands with a little overshoot |
| `flip(from, to, at)` | One value folds shut and the next opens; follow it with `tl.set(from, { opacity: 0 }, at + 0.3)` |
| `count(target, to, at, format, from, duration)` | A figure counts from `from` to `to` |
| `trace(path, at, { tip, duration, ease })` | A line draws itself from its start; with a `PenTip` the tip leads it and goes out at the end. Dashed lines get their dashes back. |
| `lock(brackets, at, { around, pad })` | `Brackets` snap onto the thing in focus, from at most 24 px larger on each side and never past 12 px from the frame's sides. With `around` they are fitted to those marks plus `pad` at that time, so one set can step from level to level. |
| `carry(from, to, at, { duration, arc, match, last, reveal, fit, keep })` | A copy of `from` flies in the top layer (`carry-layer`, drawn after everything) and lands on the matching text inside `to` (its own text, or `match`; `last` for the last occurrence), then hands over in one step. `arc: "x"` or `"y"` leads on one axis; both axes slow into the landing. `reveal: false` when another carry reveals `to`; `fit: false` keeps its size; `keep` leaves the original, dimmed while the copy leaves. Both must be untransformed at that moment. |
| `mirror(target, x, at, duration)` | A shape turns over about the vertical line at `x`, like a card: a written put into a written call |
| `morph(path, d, at, duration)` | A path becomes another with the same commands (draw both through the same points, e.g. with one `path(f)` helper): value into profit, a written put into a written call |
| `rise(at)`, `sink(at)` | The chart layer (`depth`) rises into view or sinks away |
| `cam(scale, focus, target)`, `home` | Camera props for the `world` group: scale about the chart so `focus` lands on `target` |
| `open(at)`, `tag(at)`, `close(at)` | The title wipe, the title shrinking to the corner tag, the end card |

### Colours: one colour, one meaning

The stage names six colours by what they mean (`--tone-*` on `.wt-film[data-stage="dark"]`); everything else is ink or dim. Each role reads at 7:1 or better on the stage. Call and put are far apart for every viewer (ΔE in OKLab ×100 of 29.6, and 25 for deuteranopia); for red–green colour-blind viewers up and down (7.5) and put and down (9.9) come close, which is why a signed figure always shows its sign and a put its name. This set replaced, on October 16, 2026, a palette in which an inventory of all 53 films found green carrying eleven meanings and rose twelve (section 9).

| Role | Token | Classes | Means | Never |
|---|---|---|---|---|
| Focus | `--tone-focus` #a78bfa | `wt-film-accent`, `wt-accent`, `data-tone="total"`, `Brackets`, `wt-line-position` | The figure or term the shot is about, its brackets and pen, the learner's own position | A category or a sign |
| Up | `--tone-up` #4ade80 | `wt-film-gain`, `wt-gain`, `data-tone="gain"` | A rise or a gain: the sign of a change or a result | A call, a buyer, a bid |
| Down | `--tone-down` #fb7185 | `wt-film-loss`, `wt-loss`, `data-tone="loss"` | A fall or a loss | A put, a seller, an ask |
| Call | `--tone-call` #7dd3fc | `wt-film-call`, `data-tone="call"`, `wt-line-call` | Calls, where a shot compares calls with puts | A rise or a bullish view |
| Put | `--tone-put` #f48206 | `wt-film-put`, `data-tone="put"`, `wt-line-put` | Puts, the same way | A fall or a bearish view |
| Caution | `--tone-caution` #fbbf24 | `wt-film-warn`, `data-tone="caution"` on brackets, `Hatch` | An estimate, an unknown, a value off target | A loss |
| Ink | `--tone-ink` | `wt-film-type`, `wt-film-num` | Words, figures and money: a price is a level, so it stays ink | |
| Dim | `--tone-dim` | `wt-film-dim`, `wt-film-tag`, `wt-small`, `data-tone="neutral"` | Labels, axes, units, context | Anything the learner must compare exactly |

In the kit: `Tone` (`"focus" | "up" | "down" | "call" | "put" | "caution"`), `toneClass[tone]` for stage type and chart labels (a small or dim label keeps it), `toneColor(tone)` for a stroke, a gradient or a `PenTip`, and `signTone(value)` for a signed figure (none at zero).

- **Sides have no colour.** A bid, an ask, a buyer, a seller, a holder and a writer are placed and named, never coloured: bids below asks, the side named on every row and print ("at the ask"), the learner's own order or position in focus and the other side in ink. A signed amount keeps its sign: net flow of +7,500 contracts is up, premium paid of −$4.20 is down.
- **A right is coloured only where the shot compares calls with puts**: a chain, exposure by strike, parity, a straddle, flow split by right. In a shot with one right, the contract is named in a label and its marks take their own meaning. Where a chart splits by right and by sign at once (call gamma above zero, put gamma below), the right takes the colour and the sign is carried by the side of the axis and the figure's own sign.
- **Up and down are the sign, written.** A figure in up or down carries + or − (a true minus, U+2212), and a price move ▲ or ▼, so no meaning rests on colour alone; zero is dim. Never add a sign to fit the rule: an equation stays true, and a price, a premium or a notional computed as a product ("$4.20 × 100 = $420") is a level, in ink or, as the shot's answer, in focus. Up and down belong to values that are a change, a P&L, or a debit or credit written with its sign. Green is up in English and in Chinese alike: the course teaches US markets, and the lesson page around the film uses green for a gain.
- **Checks are the one shared use.** A passed check is up with ✓, a failed one down with ✗, never in a shot that also shows a signed value.
- **Operands stay ink; the result takes the sign.** In an equation or a table row the inputs stay ink and only the result (the net, the profit, the total) takes its sign colour; six green and red figures in one table hide the answer. When colour was the only thing grouping rows (sold and bought legs, two accounts), name each group on the stage or step the other group back to dim: identical neutral outlines group nothing.
- **Evidence is drawn by line, not hue**: observed solid, modelled dashed, inferred outlined, unknown hatched in caution.
- **At most one pair of categories in colour per shot** (call and put) besides sign, focus and caution. A second split (two expiries, two lots, IV and RV) is told apart by focus and ink, by line style and by labels.
- **Never decoration.** A colour that names nothing goes.

Retired from the films, still defined and failed by the timing audit (section 7): teal and orange sides (`--wt-long`, `--wt-short`, `wt-long`, `wt-short`, `wt-line-long`, `wt-line-short`, `wt-label-long`, `wt-label-short`, `Brackets tone="short"`) and blue and lavender evidence (`--diagram-observed`, `--diagram-estimated`, `wt-ev-*`).

**On the page.** The playground under each film takes the same roles, defined on `.walkthrough` in `walkthrough.css`, so a colour means the same in the film and in its playground. Dark pages use the stage's values. Light pages need darker ones, each reading at 4.5:1 or better on every light surface (`--muted` #f0ecf4 is the darkest):

| Role | Light page | Dark page |
|---|---|---|
| Focus | #6d28d9 | #a78bfa |
| Up | #147535 | #4ade80 |
| Down | #be123c | #fb7185 |
| Call | #0369a1 | #7dd3fc |
| Put | #b04e00 | #f48206 |
| Caution | #6f5a00 | #fbbf24 |

Caution turns olive on a light page because a yellow dark enough to read is the put's orange. The closest light pairs are down and put (ΔE 10.9) and up and caution (11.3); for deuteranopes those two pairs fall to 4.8 and 4.0, so a signed figure shows its sign, a put its name and an unknown its hatch. Inside `.walkthrough` the page's older names point at the roles (`--diagram-accent` and `--diagram-model` are focus, `--diagram-gain` up, `--diagram-loss` down, `--diagram-unknown` caution), so every playground has one violet focus whatever the lesson page's palette. Page fills for the rights are `wt-call`, `wt-put`, `wt-call-soft` and `wt-put-soft`; a quantity in no role (a book's sizes, the bars beside the one in focus) is `wt-bar-neutral`, never `wt-panel-shape` (a card), and a modelled part of one (an option's time value) adds `ev-modeled` for a light fill in a dashed outline. A side-panel result takes `tone` gain, loss, caution, focus, call or put, and a tape cell its own class (`cellClass`). The review list's right and wrong are a check (up with ✓, down with ✗), and cash and shares arrows are ink. The stage eases no colour from one meaning to another: only a mark's strength (`fill-opacity`) eases.

### Numbers

| Token | How |
|---|---|
| Figure | Mono (`wt-film-num`), ink. Sizes come from the frame: `type.big` for the one hero figure, `type.num` for figures, `type.body` and `type.small` in charts |
| Money | `usd(cents)` and `signedUsd(cents)` from `@/content/world`: "$4.15", "$400" (digits 0), "−$53.00", "+$6.00". A plus sign only on a change |
| Counts and percents | `count`, `signedCount`, `contractCount`, `percent`, all with a true minus |
| Units | Say what a figure is per: "$4.20 a share", "$420 a contract (×100)" |
| Symbol | A ticker in mono capitals, neutral: a symbol never takes a meaning colour. A symbol shown as an entity (a ranked list, a portfolio row) gets a mark, a monogram tile beside the ticker; the kit adds `Ticker` with the first film that needs one |
| Contract | "ALFA Oct 18 105 call" in a sentence, "ALFA 105C · OCT 18" on a tag or a tape |
| Highlight | Focus colour and one cue, `Brackets` or `wt-focus-shape`; everything else steps back to 0.3 |
| Change | A value changes where it stands with `flip`, and counts only when the change is the point (section 6). A change chip in its sign's colour may follow once the value has landed. A value that crosses zero flips into its new colour; a colour never fades from one meaning to another |

### Other classes

| Class | Use |
|---|---|
| `wt-film-tag` | Small capitals for labels and axes |
| `wt-film-link`, `wt-film-riser`, `wt-film-ghost` | Dashed guides, focus rules, the outline of something missing |
| `wt-line-position`, `wt-line-call`, `wt-line-put`, `wt-line-reference` | Payoff and profit lines: the learner's position, a call, a put, a reference |
| `wt-panel-shape`, `wt-focus-shape` | A card at rest, and the card in focus |

## 6. Design rules

**Type and layout**
- A headline sits at `L.headY`, left-aligned at `margin`, with `maxWidth: room * 0.74` on the wide frame so it never meets the corner tag. On a phone it uses its short variant and the full `room`.
- One idea per headline, at most 8 words on the wide frame. At the default 1.5× a headline is read in two thirds of its hold (in half at 2×), so hold each one at least 3.5 s at 1× and put the numbers on the stage rather than in the sentence. If it doesn't fit two lines, shorten it.
- **Reading time.** Every other line, label, tag and figure the learner must read is still and at full contrast for at least its reading time at 1×: 20 characters a second in English with spaces counted, 9 a second in Chinese, never under 0.83 s, counted from 0.2 s after its entrance begins. A line that hands over to an identical mark in its place, or that was already read for long enough on an earlier run of the same mark, needs no second interval. The timing audit warns on every other short line (section 7); treat the warning as a fail. A line that cannot have its time goes: an unreadable tag teaches nothing.
- **No restating sub-line.** A second line under a headline adds a qualification or a figure; it never says the headline again in other words.
- **Words with the motion.** The headline that names a change stays up through the change: never swap a headline in the middle of a carry, a count or a draw, and never animate a change after its headline has gone.
- Tape notation (`10 @ $4.10`) belongs on tapes and tickets, never in a headline. In a sentence, write "10 at $4.10" or "10 张 $4.10".
- Keep text off the frame edges: anchor the last tick label of an axis to its end, and leave a right margin on the phone for labels near the edge.
- On a phone, prefer short labels and stacked layouts over shrinking type below the frame's minimums.

**Motion**
- One thing moves at a time. Marks that are one thing (the bars of one histogram, the rows of one table, the legs of one structure) move together, or with a stagger spread over at most 0.5 s in total; a stagger of 0.3 s or more between items is only for an order that is itself the lesson.
- **Scaffold before data.** Axes, tick labels, table headers and the question are up and still at least 1 s before the first data mark moves or counts; a chart never draws while its labels are still fading in.
- **A tour for a classification.** When a shot sorts several items into categories (sources by what they measure, records by status, claims by evidence), put its whole layout up and readable first, still for at least 1 s, then let one set of brackets tour it in reading order, the rest at 0.3, each stop's explanation in one caption slot. When the learner must connect separated evidence or compare several values, keep that evidence on stage together and build it in steps instead: a guide that dims it away from its conclusion hides what the learner has to hold.
- **A scale change is its own stage.** When a scale, range or camera changes, it changes alone with the grid up, and values move only after it has settled. A line that morphs and moves at once breaks this too.
- **Highlight by dimming.** When one series, row or term becomes the subject, the others dim to about 0.3 and keep their labels readable: one callout per beat, after its mark exists, pointed at it; never two cues (a pulse, a new colour, an arrow, a moving label) at once.
- **Text entrance.** Type reaches full contrast early, by an ease-out fade or a wipe; a scale reveal of type starts at 0.92 or larger (`pop` is for chips only), and no type is read while it is still travelling.
- **The motion floor.** A text, a figure or a panel comes on and goes off over at least 0.3 s at 1× (0.2 s at the default 1.5×). Nothing appears or vanishes in one frame mid-beat: a `tl.set` that shows or hides a mark is only for a hand-over (a carry, a proxy taking over in place, a value set anew where the old one stood) or a cut, where the whole stage changes at once. Entrances of 0.15 s bought to fit a beat read as pops.
- **Quiet time.** When a proof completes (a count settles, a carry lands, a lock snaps on), leave it alone at least 1 s at 1× before anything else competes for the eye, and the hero 1.5 s. Check this at every step a change moves time from, not only where it lands: a fix that shortens the gap after an earlier proof breaks that proof's rest.
- **Simplify instead of squeezing.** When a change needs time, remove a mark the lesson can do without rather than compressing other steps. Never shorten an interval a review has accepted: list every interval you shorten, before → after, and check it. Never cut shared structure (the end card's `d.close`, untouched after it) or a qualification the learner needs ("4 of 5 series").
- **Transitions dip.** Between beats, what leaves is down to a quarter before what replaces it in the same place reaches a quarter; no two lines print over each other mid-fade. The stage is never empty for 0.1 s or more, and never faint (nothing above 0.3) for 0.2 s or more: overlap the outgoing tail with the incoming head rather than leaving a gap.
- **Fade in place where a lane is crowded.** A short flight beside a crowded expression keeps touching it; a value that only changes where it stands fades or flips there instead of flying.
- Numbers, bars and lines never overshoot: data lands exactly, a big figure included (`power3.out`). Overshoot (`pop`, `slam`) is for chips and tags only.
- Carry, don't cut, where an element has somewhere to go: the question's numbers fly to their places in the first teaching shot; a trade flies from the book to the tape.
- A carry starts clear of other marks, keeps 6 px clear of every settled label and never crosses a bar, line or bracket on its way, nor another flight. Its target appears only as it lands, and it keeps its colour: colour the target the way the source is coloured (a put's orange on its chip and on its row). Where no straight path is clear, give it two legs through an invisible waypoint (a phone's trade drops down a clear lane, stops level with the tape's top row, then slides in), or let what it must pass step back to 0.3 first. Its duration follows its distance: about 0.3 s for 100 px, 0.45–0.55 s for 400 px, 0.7–0.9 s for 1000 px at 1× on the 1440 frame; a long carry done in 0.5 s smears, a short one done in 1 s drags.
- Make room first: a stack shifts down, then the new item arrives.
- Headlines run at most 8 words (18 characters in Chinese) with at most two figures, and every figure in a headline is on the stage while it is up. Name the event exactly ("bought", not "gone"; "Add 5, cancel 5"), and reveal a headline's second half only when its event happens.
- Lines draw on with `getTotalLength()` dash drawing, or are revealed by a clip rectangle that starts at width 0.
- Cut to big type rather than overlaying a claim on a chart.
- **Counts.** A figure counts only when the change is the point, for at least 1 s at 1× (0.67 s at the default 1.5×), ease-out, one figure at a time; a figure the learner must compare exactly cuts to its final value. Figures that must add up still count together (Honesty wins). Every count names its `from`, so scrubbing backwards never jumps.

- Keep every mark at least 12 px from a phone frame's sides, brackets as they scale in included.
- One colour per meaning (section 5): a line, its label, its marker and its pen share one colour, and a figure's sign wins inside a mark of another colour: a loss is red even on a put's orange line.
- Never strike out a true statement; a value that stops being true turns over (`flip`) or steps back.

**Honesty**
- Every number on screen comes from the lesson's model. If the film needs a new figure, add it to the model so the playground shows the same one.
- Say what is calculated, what is inferred and what is unknown. A missing value is shown as missing, never as zero: an emptied offer reads "—".
- Every frame is true, not only the last. Figures that must agree (a row's parts and its total) count from one start, for one length, with one ease, so every frame adds up. Never count a result that sits after "=": the frames in between show a false equation; reveal it settled. Never pair a state with an event that happened before it (a session with a run made before that session closed).
- Numbers carry across shots. A trade never un-happens: its print stays on the tape, and a size that changed in one shot starts the next shot at its new value. A readout tied to a moving marker is computed from the marker's own position every frame, never counted on a separate tween.
- The film's claims must match the lesson's captions and explanations in both languages.
- **Time runs at one speed.** When what a walk animates is time (elapsed days, a clock, a week to expiry), it runs at constant speed (`ease: "none"`) while anything the learner reads changes with it: an eased clock adds a speed-up or a slow-down the model doesn't have, on top of the one the curve shows. A jump in which nothing on screen depends on the clock may ease.

**Copy**
- English verbs agree with their subject ("You buy", "Eli buys").
- Chinese copy is idiomatic, with full-width punctuation; numbers and tickers stay half-width.
- The next card names the next lesson in syllabus order; the last lesson of a module says "Next: the module checkpoint" / "下一步：模块检查点".

## 7. Verify a film

The repository forbids unit tests. Verify with type checks, lint, a build and browser checks, and keep every report, screenshot and GIF outside the repository.

The browser checks below are scripted in `apps/web/scripts/film-audit/film-audit.sh` (they drive pages in ego-browser and start a dev server on 8262 for the run; reports go to `$FILM_AUDIT_OUT`, by default `$TMPDIR/tradely-film-audit`):

```bash
apps/web/scripts/film-audit/film-audit.sh check <id> <END>     # scan + flight check + timing audit, problems only
apps/web/scripts/film-audit/film-audit.sh timing <id> rows     # every headline's hold
apps/web/scripts/film-audit/film-audit.sh frames <id> <prefix> 12.5,20 1440x900x1 en
apps/web/scripts/film-audit/film-audit.sh play <id>...          # real-time playback; FILM_AUDIT_THROTTLE=4 slows the CPU
```

A film is done when `check` prints nothing but its stamp, warnings included, or each warning has been read and judged deliberate.

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

   Also record console errors. A text held at a scale is settled, not moving: judge "moving" by a running tween on the text or a parent, never by its transform. Also check text against stroked lines, and text and lock brackets against the frame edge (12 px on a phone). A film passes when every size and language reports no errors, no spills, no overlaps, no crossings and no edges.

   Then **the flight check**, every 0.1 s in all four configurations, for everything in flight (the carry layer, and text moved by a running tween that isn't an exit):
   - flight over settled text (closer than 6 px), and flight over flight;
   - flight over a bar, dot, line or bracket before the last 15 % of its travel, except a mark it sets off from or comes to rest on;
   - a kept copy on top of its own original for 0.2 s or more;
   - a copy whose colour differs from the text it lands on (compare against the `tspan` under the point, not just the `text`).

   Stamp every scan and contact sheet with the commit, a hash of the film and of the kit, and the time, and re-run after the last save: a sheet made before the final edit reads as current.

   Then **the timing audit**, read from the timeline itself rather than worked out by hand, in all four configurations. It fails the film on:
   - any headline (`*-head`) or the question line held under 3.5 s, from the start of its entry to the start of its exit;
   - the claim held under 4 s, or its second line over 9 words (22 Chinese characters) unless held 4.5 s;
   - a headline over 8 words (18 Chinese characters) or with more than two figures;
   - a runtime over 45.5 s, or a `hero-lock` label missing or outside 55–65 % of it;
   - a class token with two `wt-` names run together;
   - a colour off the stage's roles (section 5), checked every second of the timeline: a retired class (`wt-long`, `wt-line-short`, `wt-ev-observed` …), a `data-tone` that isn't a role (`"short"` included), or a `fill`, `stroke` or `stop-color`, set as an attribute or inline, that is a literal colour or a `var(--…)` the stage doesn't define. A colour tween caught midway shows as a literal and fails too: a colour changes by a set or a flip, never by fading between meanings;
   - two headlines on stage at once where their boxes overlap, counting the 0.35 s an outgoing one takes to fade: after a cut's `hide`, show the next headline 0.35 s later (as `swap` does), not 0.2 s;
   - a title-card name or subtitle shown in full for less than its reading time (the rates below): from the frame the wipe passes the name's last letter, or the subtitle reaches full strength, to the tag at 2.0 s.

   It also fails the motion rules, measured by what the stage shows rather than by tween lengths alone:
   - **a pop**: a text, a figure or a panel (`wt-panel-shape`, `wt-focus-shape`, `wt-chip`) that appears from below 0.1 to 0.5 or more, or vanishes the other way, in a tween or set shorter than 0.3 s. Not a pop: a carry's hand-over, a swap in place (one mark goes as another comes over at least half its area), a mark that vanishes as its flight lands, and a cut (at least 60 % of what shows changes at once);
   - **a hero that doesn't stand**: under 1.5 s from the glow at full strength until anything its brackets hold, or a group it sits in, moves or fades, or a copy of it is carried away;
   - **an empty stage** (nothing above 0.1) for 0.1 s or more, or **a faint stage** (nothing above 0.3) for 0.2 s or more, from the question until the end card; the title card's and the end card's own transitions are the kit's and aren't measured;
   - **a crossfade that prints over**: a text coming in over a text still leaving, both above 0.25, for 0.15 s or more.

   It warns on **a short count**: a tween of a plain object that writes on every update (the kit's `count`, or a film's own counter driving a readout) shorter than 1 s at 1×; under 0.05 s it is a set and is not counted. Treat the warning as a fail once the frames show the figure counting.

   It warns (without failing) when a headline names a dollar figure or a percentage that no stage text shows 0.3 s after the headline appears: made, not stated.

   It notes **still spans** (`still …` lines): more than 2 s between the question and the claim with no tween running. These are where a headline, a proof or the hero is read (a 3.5 s hold, a second of quiet, the 1.5 s stand), so most films have several; read each against its shot and cut one only where nothing on the stage is being read. On October 17, 2026 the 53 films had 162 at 1440 in English, 155 of 2–4 s and none over 5 s (the longest, recipe-inputs' two-card comparison, is its reading window), and no jury listed one.

   It also warns on **reading time** (`read …` lines): a sentence, label, tag or figure outside the headline rules above that is still and at full contrast for less than its reading time, 20 characters a second in English with spaces counted, 9 a second in Chinese, never under 0.83 s, counted from 0.2 s after its entrance begins. Exempt: a line that hands over to an identical mark in its place, and a text already read for long enough on an earlier run of the same mark (it dimmed and came back, or returned after a flight). Treat every other warning as a fail: confirm it on the frames, then give the line its time or remove it.

   The flight check also fails a carry whose target shows before the copy that becomes it lands (the kit tags each copy with `data-to`, `data-mode` and `data-match` for this), a line whose entrance rises through settled text, sampled every 0.05 s, anything (a mark or a text, arriving or in flight) that comes into the hero's glowing brackets while the hero shows above 0.25 and was not inside them when the glow reached full strength, and **brackets painted over**: a filled shape later in the document than the glowing brackets (so on top of them), at an effective fill opacity of 0.5 or more, that covers a fifth or more of their stroke for 0.1 s or more while they show above 0.25. A card, a row's background or a meter drawn after its own lock hides the lock even though the timeline says it is at full strength: give the brackets room clear of what they sit beside, rather than drawing them over it.

   Quiet time after a proof is judged by eye and by the jury: what counts as a completed proof is the lesson's, not the timeline's.
4. **Read the frames yourself.** The scan ignores text inside the camera's world group, so look at contact sheets of the 1440 English and 390 Chinese frames for labels crossing a curve, labels clipped at a plot edge, wrong numbers and awkward copy.
5. **Play it for real.** Load the lesson with no saved speed, let the film autoplay, and confirm the speed button reads 1.5×, the player reaches `data-ended` in about two thirds of the film's length, the ended panel's button ("Try it yourself") opens the playground (`data-player-mode="play"`), and every playground scene opens without console errors. Radix tabs need real pointer events in automation.
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
- **Cents and dollars.** `usd()` and `signedUsd()` take cents. One film showed $0.05 − $0.03 for $5.25 − $3.25 because a model value already in cents was divided by 100 again; another drew a $420 drop 0.2 px tall for the same reason.
- **Model extraction by script must assert every replacement.** Biome reformats lines after each save, so an edit that silently matches nothing leaves the file half-changed.
- **Keys must not be copy.** The player once keyed its reserved captions by prompt text; two scenes with the same prompt gave React duplicate keys. Key by id.
- **The phone frame is not a scaled desktop.** Each film needs its own phone choices: short labels, stacked layouts, labels anchored away from curves and edges.
- **The wide frame is the player's width, not the window's.** At a 1440 window the film is about 900 px wide, so type clamped to its minimums takes a larger share of the frame. A meter placed under a two-line headline met the chart's caption; place stacked blocks from `lineCount` and the type sizes, not from fractions of the height alone.
- **A single-number dash array merges into a dashed line's own pattern.** Drawing a `5 4` dashed line with `strokeDasharray: length` gave `736px, 4px`, and the whole line showed ahead of the pen. Give dash and gap both: `` `${length} ${length}` `` (the kit's `trace` does).
- **Film colours change on the timeline.** The diagrams' 0.3 s CSS colour transition made a scrubbed frame show a colour on its way; film marks take no CSS transition, so a class or fill set at a time is that colour at that time.
- **A carry's path can cross what the learner is reading.** A print flying from venue C to a strip under the NBBO crossed the NBBO figure; the strip moved under C. Start a carry clear of other marks and land it on the matching text.
- **GSAP reads an `svgOrigin` through the mark's current transform.** A carry that set its origin in the tween landed tens of pixels off its text whenever a seek or scrub had already moved the copy before that tween first rendered. Set the origin once at build time, while the mark is untransformed (the kit's `carry` does), and give `fromTo`s with an origin `smoothOrigin: false`.
- **Two sets at one time on one mark fight.** A carry that reveals a waypoint at the moment the next carry hides it left the waypoint showing; pass `reveal: false` to the first leg.
- **A class built by template needs its space, outside the expression.** `` `wt-film-num${tone}` `` gave `wt-film-numwt-film-loss`, and the best ask and bid lost their colour at landing. Writing the space inside the expression's string (`` `wt-a${on ? " wt-b" : ""}` ``) doesn't survive either: Biome's class sorter trims it on every save. Write `` `wt-a ${on ? "wt-b" : ""}` ``. The timing audit fails any class token with two `wt-` names in it.
- **`hide()` once lifted every mark to −12 px.** Prints stepped down the tape all slid into the top row as they faded at the cut. It now fades a mark that already sits on an offset where it is.
- **Glyphs measured before the fonts arrive.** Carries, locks fitted `around` marks and the title wipe measure real glyphs when the timeline is built, and on a learner's first, uncached visit Inter and JetBrains Mono can arrive after that, so a carry landed beside its text and brackets sat off their figure. The audits never saw it: their fonts are cached. `FilmStage` now builds the timeline once more when `document.fonts.ready` resolves after the first build, and the player seeks back as after a resize.
- **Time bought with pops.** Fixes that needed time took it from entrances (0.15 s) and swaps (a set): reviews read them as pops and scored the film down. Simplify instead (section 6).
- **Time taken from an accepted step.** An implementer shortened a payoff a review had marked fixed, three times, to pay for new work. Every package lists the intervals it shortens, and each is checked against the last review.
- **A crossing the review saw and the scan didn't.** Bars, a gross track and finally a hairline zero axis were drawn across a fading hero; each cost a review score. The flight check now fails anything coming into the hero's brackets.
- **A `fromTo` renders its start at build time.** A tween whose `onUpdate` writes a meter or moves a marker will write its start state the moment it is created, so a later walk overwrote an earlier one's readout before either began. Give such tweens `immediateRender: false`.

## 9. Style direction: what we take from motion-design references

In October 2026 we reviewed [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT), fifteen 10-second motion-design styles, each made by an AI from one prompt. Its films are rendered to MP4 with synthesised sound, so its pipeline does not apply to us, but several techniques and its review process do.

**Status:** "In use" is in the film kit today. "Piloted" is built and used in premium-payoff and quotes-orders-trades (October 5, 2026) and is being rolled out module by module; since then every film has been built on the kit, and the piloted techniques are in use across the course (October 2026). "Planned" is agreed direction, not yet built.

| Source style | What we take | Where | Status |
|---|---|---|---|
| Sticker explainer (回形针 / 林超) | Exact charts, count-ups, every beat bringing a new element | All films | In use |
| Sticker explainer | One large canvas with continuous camera moves instead of cuts; labels on leader lines; a closing card built on one huge number | Chart-heavy shots | Not taken: the films cut between shots and keep the camera to a push-in (the dictionary review below) |
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
- **Hook in the first 0.5 s.** The title card now lasts 2 s (about 1.3 s at the default 1.5×); the name wipes on from the first frame.
- **One hero moment at 60–75 % of the runtime.** We use 55–65 % (section 4); name it in the treatment.
- **Transitions carried by elements, not crossfades.** Piloted with `carry` and `morph`.
- **Key frames as poster-worthy stills** and **every frame a pure function of time**: in use.

**The pilots' reviews.** Five jury rounds on October 5–6 took premium-payoff from 5.3 to 7.2 and quotes from 4.9 to 6.6 before the last round of fixes. Each round's findings are now kit behaviour (carry, lock, mirror, line breaks, phone headline exits) or rules in sections 4, 6 and 7 and the checklist below.

**Review by an independent jury (in use).** After a film passes section 7, give a separate AI session its frames (a contact sheet every 0.5 s, plus full frames at the key moments) and ask it to judge harshly, score 1–10 on the dimensions below (5 = competent student work, 7 = solid professional, 8 = high-end agency, 9 = award shortlist), and list 5–10 fixes ordered by impact, each with times, what is wrong, why it matters and a concrete fix. Apply the fixes, then review once more. A re-score after a round of fixes first marks each earlier fix FIXED, PARTLY, NOT FIXED or REGRESSED with the frame that shows it, and a fix earns credit only if it reads on screen.

**Read-aloud at the default rate (in use).** Besides its score, a jury lists every line, label, tag and figure it cannot read aloud at a normal pace in the time the line is still at the default rate (frames 0.25 s apart, the time divided by 1.5), under a heading "Read-aloud at 1.5×", and ends the list with one line `READ <lesson> <count>`. The list does not move the score, which keeps one round comparable with the last. Counts taken before October 16, 2026 were at 2× and do not compare with later ones.

**From review to fix (in use).** A review item is applied only as part of a numbered work package, and each item carries four fields: where (the marks and source times), what is wrong, the concrete fix in the kit's moves, and **what must stay fixed** while it is done: the exact marks, holds, rests and quiet intervals next to the fix (the hero stand, an accepted rest, a neighbouring line's hold, a figure's copy). "Everything else" is not a keep field. The package is the whole job: kit notes, a review's "already right" list and anything outside a numbered item are never applied, and the implementer's report confirms every keep field unchanged. Items go in this order: the jury's own fixes, then what the learner cannot read or is not told, then timing, then visual detail; within a class, by impact on the learner. Two rounds taught this: implementers who read a whole review applied its kit-level notes, and one shortened an accepted interval to pay for new work.

| Dimension | What the jury checks |
|---|---|
| numerical_accuracy | Every figure matches the model and the lesson; units, signs and rounding are right |
| teaching_clarity | One claim per shot; the question, the proof and the claim are easy to follow at the default 1.5× |
| house_style | Dark stage, type-led, colour meanings kept, no decoration |
| motion_craft | Easing, staggering, one thing moving at a time, no dead spans, no jumps when scrubbed |
| design_typography | Hierarchy, alignment, negative space, CJK setting |
| phone_legibility | The 4:5 frame reads on its own terms |
| technical | No console errors, no spills, no overlaps, no clipped labels |

**From a motion and multimedia-learning research pass (October 15, 2026).** Sources: Material and Carbon motion guidance, Heer and Robertson (2007) on animated transitions, Tversky, Morrison and Bétrancourt (2002) on animation and comprehension, Mayer's multimedia principles, Netflix's timed-text reading rates and 3Blue1Brown's conventions. Twelve rules came out of it, numbered as the reviews cite them; each now lives in the section named.

| Rule | Where it lives |
|---|---|
| R1, R3 A scale change (a rescale, a camera move, a morph) is its own stage | Section 6, motion |
| R2 Scaffold before data | Section 6, motion |
| R4 Highlight by dimming | Section 6, motion |
| R5 Words with the motion | Section 6, type |
| R6 No restating sub-line | Section 6, type |
| R7 Common fate against order | Section 6, motion (one thing moves at a time) |
| R8 Counts only where the change is the point, 1 s or more at 1× (0.7 s until October 17, 2026) | Section 6, motion |
| R9 Carry duration by distance | Section 6, motion (the carry rule) |
| R10 Hero frozen | Section 4, the hero moment |
| R11 Text entrance at full contrast, scale from 0.92 | Section 6, motion |
| R12 Reading time, warned by the timing audit | Section 6, type; section 7 |

**From two launch-clip posts (October 2026).** [A tool list with a 20-second poster clip](https://x.com/beamnxw/status/2110408774737432738) and [a motion-engineering article on launch clips built with Remotion](https://x.com/beamnxw/status/2108616740846420354). Their pipeline (rendered video, Remotion, Three.js, Lottie, Rive, motion blur, sound, seeded randomness) does not apply to live SVG, and their holds (about 2 s on the settled opening layout, 6 s on the result, 5 s on the closing card at 1×) are one author's numbers for a 20-second commercial, not a measurement. Three process rules did apply and are in use above: the four-field correction (its keep field), the fix order, and the read-aloud check at the default rate. The clip's own structure, the whole layout up and readable from the first frame and one guide touring it in reading order, is a stronger form of scaffold before data. Tried on symbol-drawer on October 17, 2026, judged A/B by fresh juries: applied to three shots it scored 8.39 against the film's 8.44 (the guide helped where the shot classifies items, and hurt where the learner must connect evidence or compare values, because it dims away what they must hold together); kept only in the classification shot, with the other two restored, it scored 8.50. It is now a rule in section 6, "A tour for a classification".

**From a motion and easing dictionary (October 16, 2026).** [Motion Reference](https://motion-reference.takayustudio.jp/) by TakayuStudio catalogues 782 motions, each drawn as a function of time with its duration, easing, what to look for, cautions, a reduced-motion fallback and code, plus twelve guides to text motion sourced from Netflix's timed-text guides, the BBC, Material 3 and WCAG. Most of it is UI, gesture, scroll, character and effect motion a teaching film has no use for. What applies confirms rules already here, often with the same numbers: exits shorter than entrances and eased in (`t-exit`, 65–75 % of the entrance; `hide` takes 0.35 s against `show`'s 0.5 s), entrances eased out (`e-outexpo`; the kit's `power3.out`), in from below and out through the top, a carry's duration growing with the square root of its distance (`t-distance`), a stat and its bar driven by one value (`dv-stat`), points before the line (`dv-scatter`), the rest dimmed for the subject (`staging`), no overshoot for data and at most about 10 % for type, on one property (its easing guide), fixed-width digits for a count (our numbers are set in the mono), the climax late in the piece (`t-energy`, 60–75 %), a morph before a cut before a fade (`tr-morph`), and every frame a function of time with a readable still for reduced motion. Not taken: springs, back and elastic eases on figures, per-character splits and staggers (`Lines` sets whole words in both languages), the camera grammar beyond a push-in (two films use `cam`), sound sync, glitches, flash frames and 12 fps steps. What it adds is the evidence below for the film-wide defaults (it settled the default rate), and one gap it exposed: the title card's subtitle.

**Decisions on film-wide defaults (October 15–16, 2026).** Recorded here so that no single film settles them; each says whether it is still open:

- **The default rate: decided October 16, 2026, 1.5×** (`DEFAULT_RATE` in `player.tsx`; a learner's saved choice still wins). At 2× every 1× timing halved: a 3.5 s hold was read in 1.75 s, a 0.7 s count took 0.35 s, the 1.5 s hero stand 0.75 s. In the first read-aloud pass the juries listed 18 to 50 lines per film they could not finish at 2× (a model reading from frames, not a person). Measured against the reading rates the dictionary above collects (Netflix's 20 characters a second for adults, the BBC's 160–180 words a minute, Carver's 200 words a minute for learning), this share of the headline, question and claim lines leaves the stage before a reader at that pace has finished it once. The lines are the October 13 evidence's (`rows.txt`, 454 lines in 50 films at 1440 English and 390 Chinese); films have changed since, but every headline still holds 3.5 s at 1×. A line's time runs from 0.2 s after its entrance starts to the start of its exit.

  | Rate | 200 words a minute | 180 words a minute | 20 characters a second | Chinese, 9 a second |
  |---|---|---|---|---|
  | 1× | 1.5 % | 2.2 % | 0.7 % | 0 % |
  | 1.5× | 12.6 % | 23.1 % | 8.1 % | 1.1 % |
  | 2× | 39.0 % | 46.5 % | 26.0 % | 5.1 % |

  English carried the problem: the Chinese copy is short enough to be read at 2×, so the same default read differently in the two languages. At 1.5× one English line in eight still leaves before a reader at 200 words a minute finishes it.
- **The grid's drift during the hero stand: decided October 17, 2026, it stays.** None of the jury reports from October 10 to 17 mentions the drift, and the evidence below is for keeping a slow ambient layer through every hold; the hero-frozen rule covers marks on the stage, not the backdrop. `Backdrop`'s grid drifts for the whole film, and the hero-frozen rule says nothing else moves while the hero stands. Whether the drift pauses for the stand, stops altogether or stays is a kit decision for every film at once; no film removes the drift on its own. The dictionary's `ambient-hold`, `layers3` and `lp-holdcycle` keep one background element moving through every hold (small amplitude, long period, never the subject) and warn only against ambient motion large enough to notice. The drift is that layer: 6 % of the frame's width over the film, about 1.2 px a second at 1× on a 900 px frame, on grid lines drawn at 7 % of the foreground colour. That is evidence for keeping it through the stand.
- **The count floor: decided October 17, 2026, 1 s at 1×** (section 6), as proposed below; the timing audit warns on any count under it (section 7), and films move to it as each is next worked on. The research pass puts a count at 0.7 s or more at 1× (practitioners cluster at 0.6–1.5 s; Heer and Robertson tween a value over a stage of about 1 s) and proposed raising the floor to 1 s, so that a count lasts 0.67 s at the default 1.5× rather than 0.47 s (0.5 s rather than 0.35 s at 2×). Today's films already sit under the written floor in places: stocks-and-prices' five opening counts run 0.6 s. This is a rule for films, not a kit default: nothing relies on `count`'s default duration (its twelve calls all pass their own, from 0 to 1 s), and about two dozen films drive their own counters with an `onUpdate` tween, mostly 0.6 to 1.2 s at 1×. Raising the floor means changing those calls film by film. The dictionary's counts run 0.6–1.2 s as seen (`dv-stat`; an odometer roll takes 0.75 s): at the default 1.5× the 0.7 s floor plays in 0.47 s, under all of them, and a 1 s floor in 0.67 s, inside them.
- **Reading time at the default rate: decided October 17, 2026, the rule stays at 1×.** The dictionary's reading formula, max(0.7 s, 0.25 s + characters ÷ 17) as played, asks about twice what the 1× rule gives at the default 1.5× (a 40-character line: 2.6 s against 1.33 s as played), and the juries' read-aloud lists at 1.5× run from 11 to 50 lines a film. Moving the rule to 1.5× would cut copy in every film against the 45.5 s cap; instead the 1.5× layer is the jury's read-aloud list (section 9) and the rate table above, re-measured with `rate-shares.py` on fresh `rows.txt` after each round, and every line on a read-aloud list is the first item in that film's next pass. If a film cannot give its lines their time inside the cap, the choice between the rate and the rule comes back to the user.
- **The dictionary, entry by entry (October 17, 2026).** All 876 entries of Motion Reference (motions, text motions, generated concepts, guides) were checked against this runbook and the kit: 130 already adopted, 105 met by an equivalent, 631 not applicable (interactive UI, games, decoration, per-character type, overshoot on data, sound, 3D, loops, scroll, video). Six ideas remained, being taken up film by film: time runs at one speed (now in section 6); a figure shown false gets a drawn strike rather than a one-frame line-through; a shake only says "does not change" and never beside a count; films rebuild once when the web fonts arrive, so carries and brackets measure the real glyphs; and, for the playground, a solved task rings at its drag handle and a readout moves with its marker from one value.
- **The title card's subtitle: decided October 16, 2026, kept as a hook.** Every film brings it in with the name at 0.15 s, settled by 0.45 s (since October 17; it came in at 0.5 s before), and lifts it with the tag at 2.0 s as played, so it stands 1.55 s at 1× (about 1.0 s at the default 1.5×). Since October 17 every subtitle also fits that time at 1× (at most 31 characters in English and 13 in Chinese; 30 were short before), and so does the name: the wipe runs on past the last letter, for a web font that lands wide, so the name is shown in full at about 0.38 s, not when the wipe's tween ends at 0.8 s, and stands 1.62 s (measured; at most 32 characters in English or 14 in Chinese). The timing audit fails either line when it can't be read there (section 7), so the in-film line may be a shorter form of the lesson heading above the film; at the default rate the line is a preview, not something the learner must read there. The lesson title in the card heading above the film carries the text (38 subtitles repeat it word for word), and whatever a subtitle adds is taught in the film's own shots: on October 16 all 15 that differ from the heading were checked, and each detail has its shot (premium-payoff's "buyer and writer" is "Buy the 100 call" and "Now write the 95 put"; recipe-map's subtitle is its closing claim). Keep it so: a subtitle never says something only it says.
- **The colour roles: decided October 16, 2026** (section 5). An inventory recorded every coloured mark in the 53 films by what it means, 1,909 marks: green carried eleven meanings and rose twelve (a gain, a pass, a price rise, a buyer, a bid, observed evidence among them), calls and puts were each drawn five ways, and films contradicted each other (multi-leg-structures coloured bought legs rose and rank-contracts green; dex-dei-gex coloured "ask" green while the book films drew asks rose). Candidate colours were measured on the stage for contrast and for distance under simulated colour blindness (Machado 2009): once focus, up, down and caution are placed, one more pair fits well and a second does not. Three choices were made: **calls sky and puts orange**, neither of which reads as up or down in either language; **green rises in Chinese too**, as on US platforms and on the lesson page around the film, rather than red as on mainland brokers; **sides carry no colour**, since no pair was left for them and the films disagreed on which convention to follow (a book's ask side or a buyer's trade at the ask). Films move to the roles in rounds; until a film has moved, the timing audit fails it on its retired colours.
- **The roles everywhere: completed October 17, 2026.** All 53 films moved to the roles in ten rounds, each judged before and after by a jury (every colour verdict read better), and the playground under every film took the same roles with the page values in section 5, with two playground motions the dictionary found: a readout keeps its marker's pace, and a solved reach task sends one ring out from the drag handle. Three rules came out of the rounds and are in section 5: operands stay ink and only the result takes the sign; a lost grouping colour is replaced by names or by dimming the other group; and a sign is never added to make a figure fit the rule (an implementer had written "$4.20 × 100 = −$420").
- **Count-floor exceptions, October 17, 2026:** a count that would take time from an accepted rest may stay under 1 s with the reason recorded (unusual-activity's 0.9 s cursor count before its hero rest); and a count whose passing figures contradict a basis already on the stage is replaced by the exact value (option-contracts' notional, landed once all 300 shares are lit, not counted).
- **Juries, October 17, 2026.** When the Codex model the juries used was withdrawn from the account, two fallbacks were calibrated on one film: the faster one matched the old score but found half the reading problems; the slower, stricter one found most of the old fixes and more, so it judges and the faster one implements. Scores from different models are not compared; each film's first score from the new jury is its baseline. A fix must name a broken rule or a defect a learner would notice, and "none" is a valid answer: a film is settled when its previous fixes are fixed and no new material one remains, or when two rounds in a row land within 0.05 of each other with nothing regressed. Juries judge what renders from the per-frame PNGs, not the palette-reduced GIFs (two scores fell on GIF artefacts).

## 10. Checklist

- [ ] Lesson read; three claims and the opening question written down
- [ ] `<id>-model.ts` holds every shared number; the lesson imports it; no unused imports
- [ ] Treatment and shot table at the top of `<id>-film.tsx`; shot ids match the timeline labels
- [ ] Every headline has a phone variant; copy is idiomatic in both languages; no tape notation in headlines
- [ ] Every moving mark has a unique `data-f`; counts name their `from`
- [ ] Colours follow the roles (section 5) and the timing audit's colour check passes; sides are named, not coloured; every signed figure shows its sign; data never overshoots
- [ ] At most seven beats and about 45 s played; headlines of at most 8 words (18 Chinese characters) and two figures, held at least 3.5 s; the question line 3.5 s; the claim 4 s
- [ ] One hero moment at 55–65 %, named in the treatment, its figure the loudest mark, held 2 s with an after-beat (never under 1.5 s); its payoff staggered; nothing comes into its brackets while it shows
- [ ] Every entrance and exit of a text, figure or panel 0.3 s or longer; no set that shows or hides a mark except a hand-over or a whole-stage cut
- [ ] At least 1 s of quiet after each proof; beats dip into each other with no empty or faint stage and no line printed over another
- [ ] Scaffold (axes, headers, the question) still at least 1 s before the first data mark moves; a scale change alone; the subject highlighted by dimming the rest
- [ ] Every line, label, tag and figure readable in its time (20 English characters a second, 9 Chinese, never under 0.83 s); no `read` warning left unjudged; no restating sub-line; a headline stays up through the change it names
- [ ] Counts only where the change is the point, 1 s or more at 1×, one at a time; carries timed by distance; type enters at full contrast; nothing else moves while the hero stands
- [ ] Review fixes applied as a numbered work package in fix order, each with its keep field re-checked afterwards
- [ ] Every carry: top layer, starts clear, path clear of marks and flights, slows on both axes, target shown on arrival, colour kept
- [ ] Numbers carry across shots; nothing that happened un-happens
- [ ] Next card matches the syllabus (or "the module checkpoint")
- [ ] `tsc` and `biome` clean
- [ ] Scan and flight check clean at 1440 and 390, English and Chinese, stamped after the last save; frames read by eye
- [ ] Phone: every mark 12 px from the sides, brackets included
- [ ] Real playback reaches the end at the default 1.5× and opens the playground; no console errors
- [ ] `pnpm build` passes
- [ ] GIF made outside the repository and linked
- [ ] One commit with only the lesson, film and model files
