// Read-only content probe. Run from any directory with Node 24.
// Loads authored fixtures and the real pure assessment engine, without a server,
// account, database, network call, or application authentication override.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const src = path.join(root, "apps/web/src");
const ts = createRequire(path.join(root, "apps/web/package.json"))(
	"typescript",
);
const cache = new Map();
const sourceHashes = {};

function load(filename) {
	let file = path.resolve(filename);
	if (!fs.existsSync(file)) file += ".ts";
	if (cache.has(file)) return cache.get(file).exports;
	const module = { exports: {} };
	cache.set(file, module);
	const source = fs.readFileSync(file, "utf8");
	sourceHashes[path.relative(root, file)] = createHash("sha256")
		.update(source)
		.digest("hex");
	const code = ts.transpileModule(source, {
		compilerOptions: {
			target: ts.ScriptTarget.ES2022,
			module: ts.ModuleKind.CommonJS,
		},
	}).outputText;
	const localRequire = (id) => {
		// This bundler marker has no role in offline content analysis.
		if (id === "@tanstack/react-start/server-only") return {};
		if (id.startsWith("@/")) return load(path.join(src, id.slice(2)));
		if (id.startsWith(".")) return load(path.resolve(path.dirname(file), id));
		return createRequire(file)(id);
	};
	vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
		filename: file,
	})(localRequire, module, module.exports);
	return module.exports;
}

const { tradingFlowCourse } = load(path.join(src, "content/course.ts"));
const { getLessonScenarios } = load(
	path.join(src, "content/scenarios/index.server.ts"),
);
const engine = load(path.join(src, "domain/learning/engine.ts"));
const variants = [];
const exactRepeatedQuestions = [];

for (const lesson of tradingFlowCourse.lessons) {
	for (const [variantIndex, scenario] of getLessonScenarios(
		lesson.id,
	).entries()) {
		let state = engine.initialAttemptState();
		const taught = scenario.steps
			.filter((step) => step.kind !== "independent")
			.flatMap((step) => step.questions);
		const independent = scenario.steps
			.filter((step) => step.kind === "independent")
			.flatMap((step) => step.questions);
		for (const question of independent) {
			if (
				taught.some(
					(previous) => JSON.stringify({ ...previous, choices: [...previous.choices].sort((a,b)=>a.id.localeCompare(b.id)) }) === JSON.stringify({ ...question, choices: [...question.choices].sort((a,b)=>a.id.localeCompare(b.id)) }),
				)
			)
				exactRepeatedQuestions.push({
					scenarioId: scenario.id,
					questionId: question.id,
				});
		}
        const strategyResults = [];
        for (let position = 0; position < 5; position++) {
          state = engine.initialAttemptState();
          for (const step of scenario.steps) {
            for (const evidenceId of step.requiredEvidence) state = engine.transitionAttempt(scenario, state, { type: "inspect", evidenceId });
            for (const question of step.questions) {
              const action = question.input ? {
                type: "respond", questionId: question.id,
                value: question.input.kind === "number" ? "0" : "Blind response without using the supplied evidence. ".repeat(12).slice(0, question.input.maxLength),
              } : { type: "answer", questionId: question.id, choiceId: question.choices[Math.min(position, question.choices.length - 1)].id };
              state = engine.transitionAttempt(scenario, state, action);
            }
            state = engine.transitionAttempt(scenario, state, { type: "submit" });
            if (state.phase !== "complete") state = engine.transitionAttempt(scenario, state, { type: "continue" });
          }
          strategyResults.push({ position: position + 1, result: engine.assessAttempt(scenario, state) });
        }

		variants.push({
			lessonId: lesson.id,
			scenarioId: scenario.id,
			scenarioVersion: scenario.version,
			firstInRegistry: variantIndex === 0,
			stepCount: scenario.steps.length,
			independentQuestions: independent.length,
			alwaysFirstResult: strategyResults[0].result,
			strategyResults,
		});
	}
}

const demonstrated = variants.filter(
	(variant) => variant.alwaysFirstResult.status === "demonstrated",
);
console.log(
	JSON.stringify(
		{
			generatedAt: new Date().toISOString(),
			head: execFileSync("git", ["rev-parse", "HEAD"], {
				cwd: root,
				encoding: "utf8",
			}).trim(),
			method:
				"Probe five fixed answer positions (last available choice if shorter), numerical zero and repeated blind prose, opening required evidence without interpreting it. Submit through the real pure engine. Duplicate comparison normalizes choice order. This extends the original choice-only audit; it is not a learner study or browser/access test.",
			lessons: tradingFlowCourse.lessons.length,
			scenarioVariants: variants.length,
			independentQuestionInstances: variants.reduce(
				(total, row) => total + row.independentQuestions,
				0,
			),
			firstChoiceCorrectInstances: variants.reduce(
				(total, row) => total + row.alwaysFirstResult.met,
				0,
			),
			firstChoiceDemonstratedVariants: demonstrated.length,
			anyFixedPositionDemonstratedVariants: variants.filter(row => row.strategyResults.some(strategy => strategy.result.status === "demonstrated")).length,
			firstChoiceDemonstratedDefaultLessons: demonstrated.filter(
				(row) => row.firstInRegistry,
			).length,
			exactRepeatedQuestionInstances: exactRepeatedQuestions.length,
			exactRepeatedQuestions,
			variants,
			sourceHashes,
		},
		null,
		"\t",
	),
);
