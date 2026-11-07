/**
 * Static checks on the course's two languages. Run from `apps/web`:
 *
 *   pnpm check-i18n
 *
 * Fails (exit 1) on: a UI message key or `{placeholder}` missing from one language; a Chinese
 * slot with no Chinese in it, unless it holds only names and code; a Chinese word the course has
 * replaced with another (see `BANNED`); half-width punctuation straight after Chinese; and text a
 * reader sees that sits outside any pair, unless it is inside `lang="en"` or holds only names.
 *
 * Frozen case archives are skipped: saved attempts are reviewed against them as they were.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const CHINESE = /[\u4e00-\u9fff]/;
const EXPRESSION = /\$\{(?:[^{}]|\{[^{}]*\})*\}/g;

/** One meaning, one word: see "Chinese finance terms" in docs/runbook/create-svg-animation.md. */
const BANNED: readonly (readonly [RegExp, string])[] = [
	[/打印/, "记录 (a trade on the tape)"],
	[/价内|价外/, "实值, 虚值, or 实虚值 for moneyness"],
	[/执行价/, "行权价"],
	[/期权资金流/, "期权成交流"],
	[/保本/, "盈亏平衡"],
	[/名义金额/, "名义价值"],
	[/板块/, "区块"],
	[/(?<!匹)配方/, "Recipe"],
	[/资料包/, "研究包"],
	[/人群/, "总体 (a statistical population)"],
	[/盈亏比/, "盈利因子 (盈亏比 usually means average win over average loss)"],
	[/没有下限|无下限/, "没有上限 (a loss has no cap)"],
	[
		/(标为|读作|称为|计为|偏)(看涨|看跌)/,
		"看多 or 看空 for sentiment; 看涨 and 看跌 name calls and puts",
	],
];

/** Names and tickers that stay in English in either language, longest first in matching. */
const NAMES = [
	"Unusual Options Activity Screener",
	"Ticker Options Snapshot",
	"Daily Market Recap",
	"Sweeps vs Blocks Today",
	"Customize with AI",
	"Edit with AI",
	"Rank Contracts",
	"Rank Symbols",
	"Option Trades",
	"Market Recap",
	"TradingFlow AI",
	"TradingFlow",
	"Claude Code",
	"Gamma Levels",
	"Vol Surface",
	"UOA Screener",
	"Index GEX",
	"AI Insight",
	"Spotlight",
	"Annotate",
	"Cookbooks",
	"Cookbook",
	"Tradely",
	"Recipes",
	"Recipe",
	"Home",
];
const namesPattern = new RegExp(
	[...NAMES]
		.sort((a, b) => b.length - a.length)
		.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join("|"),
	"g",
);
/** Finance terms, tickers and acronyms the Chinese copy keeps in Latin letters. */
const LATIN_TERMS =
	/\b(?:0DTE|ALFA|BRDX|CRUX|DUNE|EMBR|FJOR|GLYN|HALO|IOTA|BETA|IDX|NBBO|ATR|ATM|OTM|ITM|DTE|ETF|GEX|DEX|DEI|UOA|ISO|OI|IV|RV|Delta|Gamma|Theta|Vega|Rho|Charm|Vanna|delta|gamma|theta|vega|rho|charm|vanna|Rank|Ben|Cara|Eli|FIFO|ASK|BID|MID|BBID|AASK|API|MCP|HTTP|NA|IF|USD|usd|count|ratio)\b/g;

/** True when nothing but names, terms and code is left: it needs no translation. */
function holdsOnlyNames(text: string) {
	const rest = text
		.replace(EXPRESSION, " ")
		.replace(namesPattern, " ")
		.replace(LATIN_TERMS, " ")
		.replace(/\[[^\]]*\]/g, " ");
	return (rest.match(/[A-Za-z]{3,}/g) ?? []).length === 0;
}
/** Commands, addresses and formulas, shown as typed in either language. */
const isCode = (text: string) =>
	/^(?:claude|curl|codex)\b|https?:\/\/|=>|^\{|^tools\/|\bmcp\b|^[A-Z_]+\(|^\w+\.\w+$/.test(
		text.trim(),
	);

const failures: string[] = [];
const fail = (where: string, message: string) => {
	failures.push(`${where}: ${message}`);
};

const files: string[] = [];
(function walk(directory: string) {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "archive") walk(path);
		} else if (
			/\.tsx?$/.test(entry.name) &&
			!/\.d\.ts$|routeTree\.gen/.test(entry.name)
		) {
			files.push(path);
		}
	}
})(SRC);

let pairCount = 0;
const VISIBLE_ATTRIBUTES = new Set([
	"aria-label",
	"alt",
	"placeholder",
	"title",
]);

function stringOf(node: ts.Node | undefined): string | null {
	if (!node) return null;
	if (ts.isParenthesizedExpression(node)) return stringOf(node.expression);
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
		return node.text;
	if (ts.isTemplateExpression(node)) {
		let text = node.head.text;
		for (const span of node.templateSpans)
			text += `\${${span.expression.getText()}}${span.literal.text}`;
		return text;
	}
	return null;
}

function checkMessages(source: ts.SourceFile, where: string) {
	let messages: ts.ObjectLiteralExpression | null = null;
	(function find(node: ts.Node) {
		if (
			ts.isVariableDeclaration(node) &&
			node.name.getText() === "messages" &&
			node.initializer
		) {
			const value = ts.isAsExpression(node.initializer)
				? node.initializer.expression
				: node.initializer;
			if (ts.isObjectLiteralExpression(value)) messages = value;
		}
		ts.forEachChild(node, find);
	})(source);
	if (!messages) return fail(where, "no messages object found");
	const language = (name: string) => {
		const found = (messages as ts.ObjectLiteralExpression).properties.find(
			(property) => property.name?.getText() === name,
		);
		const table = new Map<string, string>();
		if (
			found &&
			ts.isPropertyAssignment(found) &&
			ts.isObjectLiteralExpression(found.initializer)
		)
			for (const property of found.initializer.properties)
				if (ts.isPropertyAssignment(property))
					table.set(
						property.name.getText().replace(/^"|"$/g, ""),
						stringOf(property.initializer) ?? "",
					);
		return table;
	};
	const en = language("en");
	const zh = language("zh");
	const holes = (text: string) =>
		[...text.matchAll(/\{(\w+)\}/g)]
			.map((match) => match[1])
			.sort()
			.join(",");
	for (const key of en.keys())
		if (!zh.has(key)) fail(where, `message "${key}" has no Chinese`);
	for (const [key, text] of zh) {
		const english = en.get(key);
		if (english === undefined) {
			fail(where, `message "${key}" has no English`);
			continue;
		}
		if (holes(english) !== holes(text))
			fail(
				where,
				`message "${key}" has different placeholders in each language`,
			);
	}
}

for (const file of files) {
	const text = readFileSync(file, "utf8");
	const where = relative(SRC, file);
	const source = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);
	const at = (node: ts.Node) =>
		`${where}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
	if (where === join("i18n", "messages.ts")) checkMessages(source, where);
	const inPair = new Set<ts.Node>();

	(function pairs(node: ts.Node) {
		if (ts.isArrayLiteralExpression(node) && node.elements.length === 2) {
			const [first, second] = node.elements;
			const en = stringOf(first);
			const zh = stringOf(second);
			const isCopyCall =
				ts.isCallExpression(node.parent) &&
				/^(t|tr|pick)$/.test(node.parent.expression.getText());
			if (en !== null && zh !== null && !CHINESE.test(en)) {
				if (CHINESE.test(zh) || en === zh || isCopyCall) {
					pairCount++;
					inPair.add(first);
					inPair.add(second);
					const bare = zh.replace(EXPRESSION, " ");
					if (
						!CHINESE.test(zh) &&
						/[A-Za-z]{3,}/.test(bare) &&
						!holdsOnlyNames(zh) &&
						!isCode(zh)
					)
						fail(
							at(second),
							`Chinese slot has no Chinese: "${zh.slice(0, 70)}"`,
						);
				}
			}
		}
		if (ts.isCallExpression(node)) {
			const args = node.arguments;
			for (let i = 0; i + 1 < args.length; i++) {
				const en = stringOf(args[i]);
				const zh = stringOf(args[i + 1]);
				if (
					en !== null &&
					zh !== null &&
					!CHINESE.test(en) &&
					CHINESE.test(zh)
				) {
					pairCount++;
					inPair.add(args[i]);
					inPair.add(args[i + 1]);
				}
			}
		}
		if (
			ts.isConditionalExpression(node) &&
			/"zh"|"en"/.test(node.condition.getText())
		) {
			inPair.add(node.whenTrue);
			inPair.add(node.whenFalse);
		}
		if (ts.isObjectLiteralExpression(node)) {
			const value = (key: string) =>
				node.properties.find(
					(property) =>
						ts.isPropertyAssignment(property) &&
						property.name.getText() === key,
				) as ts.PropertyAssignment | undefined;
			const en = value("en");
			const zh = value("zh");
			if (en && zh) {
				pairCount++;
				inPair.add(en.initializer);
				inPair.add(zh.initializer);
			}
		}
		ts.forEachChild(node, pairs);
	})(source);

	(function strings(node: ts.Node) {
		const value = stringOf(node);
		if (value !== null && CHINESE.test(value)) {
			for (const [word, instead] of BANNED) {
				const match = value.match(word);
				if (match) fail(at(node), `"${match[0]}": use ${instead}`);
			}
			const bare = value.replace(EXPRESSION, "X");
			const punctuation = bare.match(
				/[\u4e00-\u9fff][,;!?:](?:\s|$|[\u4e00-\u9fff])/,
			);
			if (punctuation)
				fail(
					at(node),
					`half-width punctuation after Chinese: "${punctuation[0].trim()}"`,
				);
		}
		ts.forEachChild(node, strings);
	})(source);

	// Text outside any pair is English for a Chinese reader, unless it says it's meant to be.
	const hasEnglishLang = (node: ts.Node) => {
		for (
			let parent: ts.Node | undefined = node.parent;
			parent;
			parent = parent.parent
		) {
			const opening = ts.isJsxElement(parent) ? parent.openingElement : parent;
			if (
				ts.isJsxOpeningElement(opening) ||
				ts.isJsxSelfClosingElement(opening)
			) {
				const lang = opening.attributes.properties.find(
					(attribute) =>
						ts.isJsxAttribute(attribute) && attribute.name.getText() === "lang",
				);
				if (lang?.getText().includes('"en"')) return true;
			}
		}
		return false;
	};
	/** A whole file is English only when its top-level render says so, or it's only reached from such a page. */
	const englishOnlyFile =
		/^(features\/(guides|options-traders|house|trading-hall)\/|components\/guide-|routes\/(house|changelog|guides|options-traders))/.test(
			where.split("\\").join("/"),
		);
	if (!englishOnlyFile)
		(function visible(node: ts.Node) {
			if (ts.isJsxText(node)) {
				const value = node.getText().replace(/\s+/g, " ").trim();
				if (
					(value.match(/[A-Za-z]{3,}/g) ?? []).length >= 2 &&
					!CHINESE.test(value) &&
					!holdsOnlyNames(value) &&
					!isCode(value) &&
					!hasEnglishLang(node)
				)
					fail(at(node), `text outside a pair: "${value.slice(0, 70)}"`);
			}
			if (
				ts.isJsxAttribute(node) &&
				VISIBLE_ATTRIBUTES.has(node.name.getText()) &&
				node.initializer &&
				ts.isStringLiteral(node.initializer)
			) {
				const value = node.initializer.text;
				if (
					(value.match(/[A-Za-z]{3,}/g) ?? []).length >= 2 &&
					!holdsOnlyNames(value) &&
					!hasEnglishLang(node)
				)
					fail(
						at(node),
						`${node.name.getText()} outside a pair: "${value.slice(0, 70)}"`,
					);
			}
			ts.forEachChild(node, visible);
		})(source);
}

if (failures.length > 0) {
	for (const failure of failures) console.error(`fail: ${failure}`);
	console.error(`${failures.length} problem(s)`);
	process.exit(1);
}
console.log(`i18n ok: ${files.length} files, ${pairCount} pairs`);
