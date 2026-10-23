/**
 * Static checks on the concept register (`src/content/concepts.ts`) and the syllabus that
 * uses it. Run from `apps/web`:
 *
 *   pnpm check-concepts
 *
 * Fails (exit 1) on: a malformed or incomplete concept; a prerequisite that does not resolve,
 * repeats or cycles; a concept no lesson teaches; a lesson with no concepts, a duplicate
 * concept or an unknown prerequisite lesson; a cycle in the lesson graph; a hard concept
 * prerequisite that neither the lesson nor one of its prerequisite lessons teaches; a
 * `buildsOn` entry naming an unknown lesson; a checkpoint without its lesson file, or a
 * checkpoint `revisit` that names a lesson outside its module. Soft prerequisites that are not
 * taught earlier are listed as notes and do not fail.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	type Concept,
	type ConceptId,
	conceptIds,
	concepts,
} from "../src/content/concepts";
import { buildsOn, syllabus } from "../src/content/syllabus";

const failures: string[] = [];
const notes: string[] = [];
const fail = (message: string) => {
	failures.push(message);
};
const filled = (text: { en: string; zh: string }) =>
	text.en.trim().length > 0 && text.zh.trim().length > 0;

// --- The register's own shape --------------------------------------------------------------
const registered = new Set<string>();
for (const id of conceptIds) {
	if (!/^C\d{2}$/.test(id)) fail(`${id}: id is not two digits after C`);
	if (registered.has(id)) fail(`${id}: listed twice in conceptIds`);
	registered.add(id);
}
for (const key of Object.keys(concepts)) {
	if (!registered.has(key))
		fail(`${key}: in the register but not in conceptIds`);
}
const conceptList: Concept[] = conceptIds.map((id) => concepts[id]);
for (const concept of conceptList) {
	const id = concept.id;
	if (!filled(concept.name)) fail(`${id}: name is empty in one language`);
	if (!filled(concept.description))
		fail(`${id}: description is empty in one language`);
	if (concept.evidence.length < 2)
		fail(`${id}: fewer than two evidence criteria`);
	concept.evidence.forEach((criterion, index) => {
		if (!filled(criterion))
			fail(`${id}: evidence ${index + 1} is empty in one language`);
	});
	const seen = new Set<ConceptId>();
	for (const prerequisite of concept.prerequisites) {
		if (prerequisite.id === id) fail(`${id}: depends on itself`);
		if (!registered.has(prerequisite.id))
			fail(`${id}: prerequisite ${prerequisite.id} is not a concept`);
		if (seen.has(prerequisite.id))
			fail(`${id}: lists prerequisite ${prerequisite.id} twice`);
		seen.add(prerequisite.id);
		if (!filled(prerequisite.reason))
			fail(`${id} <- ${prerequisite.id}: reason is empty in one language`);
	}
}

// --- The concept graph is a DAG ------------------------------------------------------------
function findCycle(
	nodes: readonly string[],
	edgesFrom: (node: string) => readonly string[],
): string[] | null {
	const state = new Map<string, "open" | "done">();
	const path: string[] = [];
	const visit = (node: string): string[] | null => {
		const mark = state.get(node);
		if (mark === "done") return null;
		if (mark === "open") return [...path.slice(path.indexOf(node)), node];
		state.set(node, "open");
		path.push(node);
		for (const next of edgesFrom(node)) {
			const cycle = visit(next);
			if (cycle) return cycle;
		}
		path.pop();
		state.set(node, "done");
		return null;
	};
	for (const node of nodes) {
		const cycle = visit(node);
		if (cycle) return cycle;
	}
	return null;
}
const conceptCycle = findCycle(conceptIds, (id) =>
	registered.has(id)
		? concepts[id as ConceptId].prerequisites.map((p) => p.id)
		: [],
);
if (conceptCycle)
	fail(`concept prerequisites cycle: ${conceptCycle.join(" -> ")}`);

// --- Lessons and checkpoints -----------------------------------------------------------------
const entries = new Map(syllabus.map((entry) => [entry.id, entry]));
if (entries.size !== syllabus.length) {
	const counts = new Map<string, number>();
	for (const entry of syllabus)
		counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
	for (const [id, count] of counts)
		if (count > 1) fail(`lesson id ${id} appears ${count} times`);
}
const lessons = syllabus.filter((entry) => entry.kind !== "checkpoint");
const checkpoints = syllabus.filter((entry) => entry.kind === "checkpoint");
const taughtBy = new Map<ConceptId, string[]>();
for (const entry of syllabus) {
	for (const prerequisite of entry.prerequisites) {
		if (!entries.has(prerequisite))
			fail(`${entry.id}: prerequisite lesson ${prerequisite} does not exist`);
		if (prerequisite === entry.id) fail(`${entry.id}: is its own prerequisite`);
	}
	if (entry.kind === "checkpoint") {
		if (entry.concepts.length > 0)
			fail(`${entry.id}: a checkpoint carries concept codes`);
		continue;
	}
	if (entry.concepts.length === 0) fail(`${entry.id}: teaches no concept`);
	const seen = new Set<string>();
	for (const code of entry.concepts) {
		if (!registered.has(code))
			fail(`${entry.id}: concept ${code} is not in the register`);
		if (seen.has(code)) fail(`${entry.id}: lists ${code} twice`);
		seen.add(code);
		taughtBy.set(code, [...(taughtBy.get(code) ?? []), entry.id]);
	}
}
for (const id of conceptIds)
	if (!taughtBy.has(id))
		fail(`${id} (${concepts[id].name.en}): no lesson teaches it`);

const lessonCycle = findCycle(
	syllabus.map((entry) => entry.id),
	(id) => entries.get(id)?.prerequisites ?? [],
);
if (lessonCycle)
	fail(`lesson prerequisites cycle: ${lessonCycle.join(" -> ")}`);

/** Every lesson reachable through prerequisites, not including the lesson itself. */
const closures = new Map<string, Set<string>>();
function closure(id: string): Set<string> {
	const cached = closures.get(id);
	if (cached) return cached;
	const result = new Set<string>();
	closures.set(id, result);
	for (const prerequisite of entries.get(id)?.prerequisites ?? []) {
		if (result.has(prerequisite)) continue;
		result.add(prerequisite);
		for (const earlier of closure(prerequisite)) result.add(earlier);
	}
	return result;
}

// --- Hard concept prerequisites are taught by the lesson or one it builds on ----------------
if (!lessonCycle && !conceptCycle) {
	for (const lesson of lessons) {
		const available = new Set([lesson.id, ...closure(lesson.id)]);
		for (const code of lesson.concepts) {
			if (!registered.has(code)) continue;
			for (const prerequisite of concepts[code].prerequisites) {
				const teachers = taughtBy.get(prerequisite.id) ?? [];
				if (teachers.some((teacher) => available.has(teacher))) continue;
				const line = `${lesson.id} teaches ${code} (${concepts[code].name.en}), whose ${prerequisite.strength} prerequisite ${prerequisite.id} (${concepts[prerequisite.id].name.en}) is taught only by: ${teachers.join(", ") || "nothing"}`;
				if (prerequisite.strength === "hard") fail(line);
				else notes.push(line);
			}
		}
	}
}

// --- buildsOn names real lessons ---------------------------------------------------------------
for (const [id, builds] of Object.entries(buildsOn)) {
	if (!entries.has(id)) fail(`buildsOn: ${id} is not a lesson`);
	for (const earlier of builds.lessons)
		if (!entries.has(earlier))
			fail(`buildsOn ${id}: ${earlier} is not a lesson`);
}

// --- Checkpoints route back into their own module ---------------------------------------------
const lessonsDir = fileURLToPath(
	new URL("../src/features/learning/lessons/", import.meta.url),
);
for (const checkpoint of checkpoints) {
	const file = `${lessonsDir}checkpoint-${checkpoint.moduleId}.tsx`;
	if (!existsSync(file)) {
		fail(`${checkpoint.id}: no file checkpoint-${checkpoint.moduleId}.tsx`);
		continue;
	}
	const source = readFileSync(file, "utf8");
	const revisits = [...source.matchAll(/revisit:\s*"([a-z0-9-]+)"/g)].map(
		(match) => match[1],
	);
	if (revisits.length === 0)
		fail(`${checkpoint.id}: no scene names a lesson to revisit`);
	for (const revisit of new Set(revisits)) {
		const lesson = entries.get(revisit);
		if (!lesson || lesson.kind === "checkpoint")
			fail(`${checkpoint.id}: revisit "${revisit}" is not a lesson`);
		else if (lesson.moduleId !== checkpoint.moduleId)
			fail(
				`${checkpoint.id}: revisit "${revisit}" is in module ${lesson.moduleId}, not ${checkpoint.moduleId}`,
			);
	}
}
for (const name of readdirSync(lessonsDir)) {
	const match = /^checkpoint-([a-z]+)\.tsx$/.exec(name);
	if (!match || match[1] === "kit") continue;
	if (!checkpoints.some((checkpoint) => checkpoint.moduleId === match[1]))
		fail(`${name}: no checkpoint in the syllabus for module ${match[1]}`);
}

// --- Report -----------------------------------------------------------------------------------
for (const note of notes) console.log(`note: ${note}`);
if (failures.length > 0) {
	for (const failure of failures) console.error(`fail: ${failure}`);
	console.error(`${failures.length} problem(s)`);
	process.exit(1);
}
const edges = conceptList.flatMap((concept) => concept.prerequisites);
const hard = edges.filter((edge) => edge.strength === "hard").length;
console.log(
	`concepts ok: ${conceptIds.length} concepts, ${edges.length} prerequisite edges (${hard} hard, ${edges.length - hard} soft), ${lessons.length} lessons, ${checkpoints.length} checkpoints`,
);
