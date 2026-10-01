/** CJK characters render about as wide as the font size; Latin mono glyphs about 0.6 of it. */
const isWide = (char: string) => (char.codePointAt(0) ?? 0) > 0x2e80;

/** Rough rendered width of mono text at a font size, for layout decisions in SVG. */
export function textWidth(text: string, size: number) {
	let width = 0;
	for (const char of text) width += isWide(char) ? size : size * 0.6;
	return width;
}

/** Closing punctuation that may not start a line in CJK text. */
const NO_LINE_START = /^[、。，．：；！？）」』》〉】〕”’]$/;

/**
 * Greedy line breaks: Latin text breaks at spaces, CJK text between any two characters.
 * A closing mark that would start a line takes the character before it along, so "。"
 * never sits alone at the start of a line. Returns at least one line.
 */
export function wrapText(text: string, maxWidth: number, size: number) {
	const tokens: string[] = [];
	let word = "";
	for (const char of text) {
		if (char === " ") {
			if (word) tokens.push(word);
			tokens.push(" ");
			word = "";
		} else if (isWide(char)) {
			if (word) tokens.push(word);
			tokens.push(char);
			word = "";
		} else word += char;
	}
	if (word) tokens.push(word);
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
