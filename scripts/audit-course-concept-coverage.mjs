import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// Read-only reconciliation of named app concepts with the authored course.
// Definitions stay in the lesson packages; this register links to their owner.
const root = resolve(import.meta.dirname, "..");
const app = resolve(root, "../tradingflow-webapp-fullstack");
const ts = createRequire(resolve(root, "apps/web/package.json"))("typescript");
const sourceHashes = {};
const read = (file) => {
	const content = readFileSync(file, "utf8");
	sourceHashes[file] = createHash("sha256").update(content).digest("hex");
	return content;
};
const sourceFile = (file, text = read(file)) =>
	ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
const syllabusFile = sourceFile(
	resolve(root, "apps/web/src/content/syllabus.ts"),
);
const lessons = [];
function visit(node) {
	if (
		ts.isCallExpression(node) &&
		node.expression.getText(syllabusFile) === "lesson"
	) {
		const [id, module, title, , , , concepts] = node.arguments;
		lessons.push({
			id: id.text,
			module: module.text,
			title: title.text,
			families: concepts.elements.map((item) => item.text),
		});
	}
	ts.forEachChild(node, visit);
}
visit(syllabusFile);

const groups = {
	C01: "ticker symbol underlyingTicker underlyingType spotPrice underlyingPrice marketCap sector averageVolume earningsDate",
	C02: "contractId option_symbol put_call strike expiration type daysToExpiration zeroDte",
	C03: "moneyness premium size trade_premium",
	C04: "bid ask bidSize askSize price quote_side",
	C05: "aggressor",
	C06: "tradeSide side",
	C07: "sentiment",
	C08: "openInterest oi oiChange volume tPlusOneConfirmation",
	C09: "optionStrategy",
	C10: "rawMode aggregatedMode tradeCount optionFlow trade_count_total",
	C11: "tradeActivityType activityType blockTrade",
	C12: "relativeVolume volumeToOI unusualOptionsActivity",
	C13: "delta gamma theta vega rho",
	C14: "impliedVolatility historicalVolatility realizedVolatility ivVsRvSpread iv30_rv20 ivCrush atmIv30 iv30",
	C15: "impliedVolatilitySurface skew termStructure skew25d30d butterfly25d30d",
	C16: "ivRank ivPercentile iv_rank iv_percentile iv_rank_1y iv_percentile_1y",
	C17: "deltaExposure netDEX net_dex netPremium net_premium sentiment_premium premium_total",
	C18: "deltaImpact dei net_dei deltaOiDei",
	C19: "gammaExposure gex netGEX grossGEX netGex grossGex callPutGexRatio callPutRatio optionChain",
	C20: "gammaRegime gammaTransition zeroGammaFlip gammaSqueeze",
	C21: "callWall putWall callWallStrike putWallStrike gammaMagnetStrike gammaMagnet zeroDteTopStrike maxPainStrike maxPain dailyATR dailyAtr expiryScopeShare",
	C22: "charm vanna charmPinStrike charmPin",
	C23: "rank_symbol_discovery rank_contract_discovery contract_concentration",
	C24: "executedAt eventTime receiptTime asOfDate",
	C25: "flowActivityCalibration recencyHalfLife",
	C26: "pointInTimeResearch",
	C27: "researchPacket recapAudit",
	C28: "portfolioPosition portfolioCash portfolioPnl",
	C29: "portfolioReturn portfolioStatistics",
	C30: "portfolioGreeks",
};
const normalize = (value) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
const familyByName = new Map(
	Object.entries(groups).flatMap(([family, names]) =>
		names.split(" ").map((name) => [normalize(name), family]),
	),
);
const terms = [];
const add = (
	catalog,
	key,
	term,
	file,
	line,
	aliases = [],
	family = undefined,
) => {
	const match = family ?? familyByName.get(normalize(key));
	terms.push({
		catalog,
		key,
		term,
		aliases,
		source: `${file}:${line}`,
		family: match ?? null,
		definitionAndWorkedExample: lessons
			.filter((lesson) => lesson.families.includes(match))
			.map((lesson) => lesson.id),
		status:
			"Authored mapping; independent domain and learner review remain release gates.",
	});
};
const localeFile = resolve(app, "src/locales/en-US.ts");
const locale = read(localeFile);
for (const match of locale.matchAll(
	/'pages\.optionTrades\.glossary\.entries\.([^.]+)\.term': '([^']+)'/g,
)) {
	const aliases = [
		...locale.matchAll(
			new RegExp(
				`'pages\\.optionTrades\\.glossary\\.entries\\.${match[1]}\\.alias\\.[^']+': '([^']+)'`,
				"g",
			),
		),
	].map((item) => item[1]);
	add(
		"app glossary",
		match[1],
		match[2],
		localeFile,
		locale.slice(0, match.index).split("\n").length,
		aliases,
	);
}
for (const match of locale.matchAll(
	/'pages\.contractFlowRank\.symbolDrawer\.gexEducation\.([^.]+)\.title': '([^']+)'/g,
))
	add(
		"GEX education",
		match[1],
		match[2],
		localeFile,
		locale.slice(0, match.index).split("\n").length,
	);

const ontologyFile = resolve(app, "doc/ontology/concepts.md");
let entity = "";
for (const [index, line] of read(ontologyFile).split("\n").entries()) {
	if (/^## (Underlying|Option Chain|Option Contract|Option Trade)$/.test(line))
		entity = line.slice(3);
	if (!line.startsWith("- **`")) continue;
	for (const match of line.split("—")[0].matchAll(/`([^`]+)`/g))
		add(
			"domain model",
			match[1],
			`${entity}: ${match[1]}`,
			ontologyFile,
			index + 1,
			[],
			entity === "Option Contract" && match[1] === "premium"
				? "C04"
				: undefined,
		);
}

const metricFile = resolve(app, "src/lib/metrics/registry.ts");
const metrics = sourceFile(metricFile);
function metricsVisit(node) {
	if (ts.isObjectLiteralExpression(node)) {
		const properties = new Map(
			node.properties
				.filter(ts.isPropertyAssignment)
				.map((property) => [
					property.name.getText(metrics),
					property.initializer,
				]),
		);
		const id = properties.get("id");
		const label = properties.get("label");
		if (id && label && ts.isStringLiteral(id) && ts.isStringLiteral(label))
			add(
				"metric registry",
				id.text,
				label.text,
				metricFile,
				metrics.getLineAndCharacterOfPosition(node.pos).line + 1,
			);
	}
	ts.forEachChild(node, metricsVisit);
}
metricsVisit(metrics);

for (const [key, family, label] of [
	["vol.skew25d30d", "C15", "25-delta skew / risk reversal"],
	["vol.butterfly25d30d", "C15", "25-delta butterfly"],
	["vol.ivRank", "C16", "IV rank"],
	["vol.ivPercentile", "C16", "IV percentile"],
]) {
	const token = key.split(".").at(-1);
	const line = locale.split("\n").findIndex((line) => line.includes(token)) + 1;
	if (!line) throw new Error(`Missing expected app concept: ${key}`);
	add("volatility labels", key, label, localeFile, line, [], family);
}
const portfolioFile = resolve(
	app,
	"doc/domain-knowledge/portfolio/functionality.md",
);
const portfolio = read(portfolioFile);
for (const [key, family, labels] of [
	[
		"positions",
		"C28",
		[
			"cost basis",
			"mark",
			"market value",
			"cash",
			"buying power",
			"realized P&L",
			"unrealized P&L",
			"allocation",
		],
	],
	[
		"performance",
		"C29",
		[
			"equity curve",
			"external cash flows",
			"TWR",
			"benchmark",
			"win rate",
			"average win/loss",
			"profit factor",
			"FIFO",
			"monthly P&L",
			"attribution",
		],
	],
	[
		"exposure",
		"C30",
		[
			"portfolio delta",
			"portfolio gamma",
			"portfolio theta",
			"portfolio vega",
			"coverage",
			"journal",
		],
	],
])
	for (const label of labels)
		add(
			"portfolio (internal rollout)",
			`${key}.${normalize(label)}`,
			label,
			portfolioFile,
			portfolio.split("\n").indexOf("## Dashboard") + 1,
			[],
			family,
		);

const inventoryFile = resolve(
	root,
	"docs/reviews/platform-agnostic-concept-coverage-2026-09-08.md",
);
const abilityFamilies = {
	rank_symbol_discovery: "C23",
	rank_symbol_overview: "C24",
	rank_symbol_flow: "C17",
	rank_symbol_positioning: "C08",
	rank_symbol_gex: "C19",
	rank_symbol_volatility: "C15",
	rank_symbol_chain: "C24",
	rank_contract_discovery: "C23",
	rank_contract_flow: "C17",
	rank_contract_positioning: "C08",
	rank_contract_tradeability: "C05",
	live_tape: "C24",
	historical_tape: "C24",
	symbol_discovery: "C23",
	symbol_flow_history: "C17",
	symbol_positioning_context: "C08",
	symbol_chain_inspection: "C24",
	contract_intraday_flow: "C17",
	contract_positioning_history: "C08",
	iv_vs_realized: "C14",
	gex_oi_context: "C19",
	structure_cross_check: "C24",
	post_move_structure: "C26",
	term_structure_skew: "C15",
	contract_tradeability: "C05",
	unusual_contract_scan: "C12",
	contract_concentration: "C23",
	put_call_price_context: "C07",
	current_follow_through: "C26",
	post_move_follow_through: "C26",
	recent_call_flow: "C07",
	multi_session_oi_accumulation: "C08",
	pre_move_window: "C26",
	flow_cross_check: "C24",
	call_sale_check: "C09",
	unusual_positioning: "C12",
	post_move_backtrace: "C26",
	iv_regime: "C14",
};
const abilityFile = resolve(app, "src/domain/researchWorkflows/catalog.ts");
const abilities = read(abilityFile);
for (const catalog of [
	"RESEARCH_ABILITY_KEYS",
	"RESEARCH_LENS_KEYS",
	"RESEARCH_WORKFLOW_KEYS",
]) {
	const block = abilities.match(
		new RegExp(`${catalog} = \\[([\\s\\S]*?)\\] as const`),
	);
	if (!block) throw new Error(`Missing research catalog ${catalog}`);
	for (const match of block[1].matchAll(/'([^']+)'/g))
		add(
			catalog,
			match[1],
			match[1].replaceAll("_", " "),
			abilityFile,
			abilities.slice(0, block.index).split("\n").length,
			[],
			abilityFamilies[match[1]],
		);
}
const calibrationFile = resolve(app, "src/domain/optionTrades/flowActivity.ts");
read(calibrationFile);
add(
	"statistical model (release status separate)",
	"recencyHalfLife",
	"Recency weighting and half-life",
	calibrationFile,
	1,
);
add(
	"statistical model (release status separate)",
	"flowActivityCalibration",
	"Historical calibration and abnormality",
	resolve(app, "src/domain/optionTrades/flowMatrixTypes.ts"),
	1,
);
const families = [
	...read(inventoryFile).matchAll(/^\| (C\d\d) \| ([^|]+) \|/gm),
].map((match) => ({
	id: match[1],
	requiredConcepts: match[2].trim(),
	lessons: lessons
		.filter((lesson) => lesson.families.includes(match[1]))
		.map((lesson) => ({ id: lesson.id, title: lesson.title })),
}));
const unmapped = terms.filter(
	(term) => !term.family || !term.definitionAndWorkedExample.length,
);
const result = {
	generatedAt: new Date().toISOString(),
	scope:
		"Named glossary, GEX education, domain-model attributes, metric definitions, volatility labels and documented portfolio analytics. This maps teaching ownership; it does not certify learning or treat vendor conventions as universal.",
	lessons: lessons.length,
	families: families.length,
	sourceTerms: terms.length,
	unmapped: unmapped.map((term) => ({ catalog: term.catalog, key: term.key })),
	coverageFamilies: families,
	terms,
	sourceHashes,
};
const output = process.argv[2];
if (output)
	writeFileSync(
		resolve(root, output),
		`${JSON.stringify(result, null, "\t")}\n`,
	);
console.log(
	JSON.stringify(
		{
			lessons: result.lessons,
			families: result.families,
			sourceTerms: result.sourceTerms,
			unmapped: result.unmapped,
		},
		null,
		2,
	),
);
if (
	unmapped.length ||
	lessons.length !== 36 ||
	families.length !== 30 ||
	families.some((family) => !family.lessons.length)
)
	process.exitCode = 1;
