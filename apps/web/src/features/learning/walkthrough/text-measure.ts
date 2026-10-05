/** CJK characters render about as wide as the font size; Latin mono glyphs about 0.6 of it. */
const isWide = (char: string) => (char.codePointAt(0) ?? 0) > 0x2e80;

/** Rough rendered width of mono text at a font size, for layout decisions in SVG. */
export function textWidth(text: string, size: number) {
	let width = 0;
	for (const char of text) width += isWide(char) ? size : size * 0.6;
	return width;
}

/** Closing punctuation that may not start a line in CJK text. */
export const NO_LINE_START = /^[、。，．：；！？）」』》〉】〕”’]$/;

/** Chinese words, where the runtime can find them (see `tokenize`'s `words`). */
const segmenter =
	typeof Intl.Segmenter === "function"
		? new Intl.Segmenter("zh", { granularity: "word" })
		: undefined;

/** The course's terms, which the runtime's dictionary splits (标|的, 权利|金): kept whole. */
const TERMS = new RegExp(
	[
		"盈亏平衡点",
		"隐含波动率",
		"未平仓量",
		"时间价值",
		"内在价值",
		"逐笔成交",
		"权利金",
		"行权价",
		"中间价",
		"订单簿",
		"成交量",
		"标的",
		"看涨",
		"看跌",
		"卖出",
		"买入",
		"盈亏",
		"实值",
		"虚值",
		"平值",
		"合约",
	].join("|"),
	"g",
);

/**
 * The pieces a line may break between: Latin words, single spaces, and CJK characters, or
 * with `words` whole CJK words, so 成交 never splits across lines.
 */
export function tokenize(text: string, words = false) {
	const tokens: string[] = [];
	let word = "";
	let wide = "";
	const flushWide = () => {
		if (!wide) return;
		if (words && segmenter) {
			const split = (part: string) => {
				for (const { segment } of segmenter.segment(part)) tokens.push(segment);
			};
			let from = 0;
			for (const term of wide.matchAll(TERMS)) {
				split(wide.slice(from, term.index));
				tokens.push(term[0]);
				from = term.index + term[0].length;
			}
			split(wide.slice(from));
		} else tokens.push(...wide);
		wide = "";
	};
	for (const char of text) {
		if (char === " ") {
			flushWide();
			if (word) tokens.push(word);
			tokens.push(" ");
			word = "";
		} else if (isWide(char)) {
			if (word) tokens.push(word);
			word = "";
			wide += char;
		} else {
			flushWide();
			word += char;
		}
	}
	flushWide();
	if (word) tokens.push(word);
	return tokens;
}

/**
 * Greedy line breaks between `tokenize`'s pieces. A closing mark that would start a line
 * takes the token before it along, so "。" never sits alone at the start of a line.
 * Returns at least one line.
 */
export function wrapText(
	text: string,
	maxWidth: number,
	size: number,
	{ words = false }: { words?: boolean } = {},
) {
	const tokens = tokenize(text, words);
	const lines: string[] = [];
	let line: string[] = [];
	for (const token of tokens) {
		const next = [...line, token].join("");
		if (line.length && textWidth(next.trimEnd(), size) > maxWidth) {
			const kept = line.slice(0, -1);
			const carry =
				NO_LINE_START.test(token) && line.at(-1) !== " " && kept.join("").trim()
					? line.slice(-1)
					: [];
			lines.push((carry.length ? kept : line).join("").trimEnd());
			line = token === " " ? carry : [...carry, token];
		} else line.push(token);
	}
	const last = line.join("");
	if (last.trim()) lines.push(last.trimEnd());
	return lines.length ? lines : [""];
}

/**
 * Lines for text made of " · " parts: as many whole parts on each line as fit. A part
 * wider than the room keeps a line to itself.
 */
export function packParts(text: string, maxWidth: number, size: number) {
	const lines: string[] = [];
	for (const part of text.split(" · ")) {
		const last = lines.at(-1);
		if (last !== undefined && textWidth(`${last} · ${part}`, size) <= maxWidth)
			lines[lines.length - 1] = `${last} · ${part}`;
		else lines.push(part);
	}
	return lines;
}

/**
 * At most two rows: the first line `wrapText` would give, then the rest of the text, which
 * condenses to fit if it still runs long.
 */
export function twoRows(text: string, maxWidth: number, size: number) {
	const [first] = wrapText(text, maxWidth, size);
	const rest = text.slice(first.length).trimStart();
	return rest ? [first, rest] : [first];
}

/**
 * The start of text placed at `x` with `anchor`. A label whose anchor changes between steps
 * is drawn start-anchored from here, so it glides to its new place instead of first jumping
 * by its width.
 */
export function startAt(
	text: string,
	x: number,
	size: number,
	anchor: "start" | "middle" | "end",
) {
	const width = textWidth(text, size);
	return anchor === "start"
		? x
		: anchor === "middle"
			? x - width / 2
			: x - width;
}
