/** CJK characters render about as wide as the font size; Latin mono glyphs about 0.6 of it. */
const isWide = (char: string) => (char.codePointAt(0) ?? 0) > 0x2e80;

/** Rough rendered width of mono text at a font size, for layout decisions in SVG. */
export function textWidth(text: string, size: number) {
	let width = 0;
	for (const char of text) width += isWide(char) ? size : size * 0.6;
	return width;
}

/**
 * Greedy line breaks: Latin text breaks at spaces, CJK text between any two characters.
 * Returns at least one line.
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
	let line = "";
	for (const token of tokens) {
		const next = line + token;
		if (line && textWidth(next.trimEnd(), size) > maxWidth) {
			lines.push(line.trimEnd());
			line = token === " " ? "" : token;
		} else line = next;
	}
	if (line.trim()) lines.push(line.trimEnd());
	return lines.length ? lines : [""];
}
