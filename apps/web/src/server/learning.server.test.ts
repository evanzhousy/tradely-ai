import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
	db: vi.fn(),
	access: vi.fn(),
	capture: vi.fn(),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/db", async () => ({
	...(await import("@tradely/db/schema/index")),
	createDb: mocks.db,
}));
vi.mock("./access.server", () => ({
	resolveCurrentLessonAccess: mocks.access,
}));
vi.mock("./analytics/posthog.server", () => ({
	captureServerException: mocks.capture,
}));

import * as schema from "@tradely/db/schema/index";
import { eq } from "drizzle-orm";
import { optionPrintScenarios } from "@/content/scenarios/option-print";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import { referenceAction } from "@/domain/learning/test-helpers";
import { initialAttemptState, transitionAttempt, assessAttempt } from "@/domain/learning/engine";
import type {
	LearningAction,
	LearningResponse,
	LearningView,
} from "@/domain/learning/types";
import { openLearningSchema, updateLearningSchema } from "./learning";
import { openLearningImpl, updateLearningImpl } from "./learning.server";

describe("learning persistence and authorization (isolated PostgreSQL)", () => {
	const pg = new PGlite();
	const db = drizzle(pg, { schema });
	const lessonId = "validate-option-print";
	const open = (restart = false) => openLearningImpl({ lessonId, restart });
	const viewOf = (response: LearningResponse): LearningView => {
		expect(response.ok).toBe(true);
		if (!response.ok) throw new Error(response.reason);
		return response.view;
	};
	const command = (view: LearningView, action: LearningAction) => ({
		lessonId,
		attemptId: view.attemptId,
		revision: view.revision,
		commandId: randomUUID(),
		action,
	});
	beforeAll(async () => {
		for (const filename of [
			"0000_salty_randall.sql",
			"0001_low_clea.sql",
			"0002_learning_attempts.sql",
		])
			await pg.exec(
				readFileSync(
					new URL(
						`../../../../packages/db/src/migrations/${filename}`,
						import.meta.url,
					),
					"utf8",
				),
			);
	});
	afterAll(async () => {
		await pg.close();
	});
	beforeEach(async () => {
		await pg.exec("TRUNCATE lesson_attempt, lesson_progress, app_user CASCADE");
		vi.clearAllMocks();
		mocks.db.mockReturnValue(db);
		mocks.access.mockResolvedValue({
			access: { allowed: true, reason: "course-pass" },
			courseAccess: { userId: "learner-a" },
		});
	});
 async function decisionStart() {
  let view = viewOf(await open());
  view = viewOf(await updateLearningImpl(command(view, { type: "submit" })));
  return viewOf(await updateLearningImpl(command(view, { type: "continue" })));
 }
 async function finish(id = lessonId) {
  let view = viewOf(await openLearningImpl({lessonId:id,restart:false}));
  const scenario = getLessonScenarios(id).find(item=>item.id===view.scenarioId)!;
  for (const step of scenario.steps) {
   for (const question of step.questions) view = viewOf(await updateLearningImpl({ ...command(view, referenceAction(question)), lessonId:id }));
   view = viewOf(await updateLearningImpl({ ...command(view,{type:"submit"}), lessonId:id }));
   if(view.phase!=="complete")view=viewOf(await updateLearningImpl({...command(view,{type:"continue"}),lessonId:id}));
  }
  return view;
 }
 it("migrates, saves a numerical response, resumes and retries a lost response exactly once", async()=>{
  const initial=await decisionStart();
  const payload=command(initial,{type:"respond",questionId:"premium",value:"63000"});
  const saved=viewOf(await updateLearningImpl(payload));
  expect(saved.revision).toBe(initial.revision+1);
  expect(viewOf(await updateLearningImpl(payload))).toEqual(saved);
  expect(viewOf(await open()).answers).toEqual({premium:"63000"});
  expect(await updateLearningImpl(command(initial,{type:"respond",questionId:"premium",value:"1"}))).toEqual({ok:false,reason:"conflict"});
 });
 it("permits one active attempt under simultaneous starts and repeated retries",async()=>{
  const views=(await Promise.all([open(),open()])).map(viewOf);
  expect(views[0].attemptId).toBe(views[1].attemptId);
  expect(viewOf(await open(true)).attemptId).toBe(views[0].attemptId);
  expect(await db.select().from(schema.lessonAttempt)).toHaveLength(1);
 });
 it("keeps two lessons independent for the same learner",async()=>{
  const print=viewOf(await open());
  const contract=viewOf(await openLearningImpl({lessonId:"rank-contracts",restart:false}));
  expect(contract.attemptId).not.toBe(print.attemptId);
  const saved=viewOf(await updateLearningImpl({...command(contract,{type:"hint"}),lessonId:"rank-contracts"}));
  expect(saved.step.hint).not.toBeNull();
  expect(viewOf(await open()).step.hint).toBeNull();
 });
 it("atomically resolves concurrent numerical decisions without overwriting the winner",async()=>{
  const first=await decisionStart();
  const results=await Promise.all(["63000","64000"].map(value=>updateLearningImpl(command(first,{type:"respond",questionId:"premium",value}))));
  expect(results.filter(result=>result.ok)).toHaveLength(1);
  expect(results).toContainEqual({ok:false,reason:"conflict"});
  expect(viewOf(await open()).revision).toBe(first.revision+1);
 });
 it("checks identity and paid access on every request",async()=>{
  const first=viewOf(await open()); const payload=command(first,{type:"hint"});
  mocks.access.mockResolvedValue({access:{allowed:true},courseAccess:{userId:"learner-b"}});
  expect(await updateLearningImpl(payload)).toEqual({ok:false,reason:"not_found"});
  mocks.access.mockResolvedValue({access:{allowed:false,reason:"payment-required"},courseAccess:{userId:"learner-a"}});
  expect(await updateLearningImpl(payload)).toEqual({ok:false,reason:"access_denied"});
  expect(await open()).toEqual({ok:false,reason:"access_denied"});
  mocks.access.mockResolvedValue({access:{allowed:false,reason:"billing-unavailable"},courseAccess:{userId:"learner-a"}});
  expect(await open()).toEqual({ok:false,reason:"unavailable"});
  mocks.access.mockResolvedValue({access:{allowed:false,reason:"signed-out"},courseAccess:{userId:null}});
  expect(await open()).toEqual({ok:false,reason:"signed_out"});
  expect(await openLearningImpl({lessonId:"missing-lesson",restart:false})).toEqual({ok:false,reason:"not_found"});
 });
 it("requires an explicit restart for retired content and preserves the old record",async()=>{
  const first=viewOf(await open());
  await db.update(schema.lessonAttempt).set({scenarioVersion:999}).where(eq(schema.lessonAttempt.id,first.attemptId));
  expect(await open()).toEqual({ok:false,reason:"retired"});
  expect(viewOf(await open(true)).attemptId).not.toBe(first.attemptId);
  const [old]=await db.select().from(schema.lessonAttempt).where(eq(schema.lessonAttempt.id,first.attemptId));
  expect(old).toMatchObject({status:"retired",scenarioVersion:999});
 });
 it("stores immutable results, alternates practice cases and preserves historical progress",async()=>{
  await db.insert(schema.appUser).values({clerkUserId:"learner-a"});
  await db.insert(schema.lessonProgress).values({clerkUserId:"learner-a",lessonId,contentVersion:1,lastPositionSeconds:123,completedAt:new Date("2026-09-01T00:00:00Z")});
  const view=await finish();
  expect(view.result).toMatchObject({status:"demonstrated",met:2});
  expect(viewOf(await open()).result).toEqual(view.result);
  expect(viewOf(await updateLearningImpl(command(view,{type:"submit"})))).toEqual(view);
  const retry=viewOf(await open(true));
  expect(retry.scenarioId).toBe("validate-option-print-practice-2");
  const [legacy]=await db.select().from(schema.lessonProgress);
  expect(legacy.lastPositionSeconds).toBe(123);
  expect(legacy.completedAt?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
 });
 it("preserves an archived submitted scenario without certifying the updated lesson",async()=>{
  await db.insert(schema.appUser).values({clerkUserId:"learner-a"});
  const legacy=optionPrintScenarios[0];let state=initialAttemptState();
  for(const step of legacy.steps){
   for(const evidenceId of step.requiredEvidence)state=transitionAttempt(legacy,state,{type:"inspect",evidenceId});
   for(const question of step.questions)state=transitionAttempt(legacy,state,referenceAction(question));
   state=transitionAttempt(legacy,state,{type:"submit"});
   if(state.phase!=="complete")state=transitionAttempt(legacy,state,{type:"continue"});
  }
  await db.insert(schema.lessonAttempt).values({id:"legacy-submitted",clerkUserId:"learner-a",lessonId,scenarioId:legacy.id,scenarioVersion:legacy.version,status:"submitted",state,assessment:assessAttempt(legacy,state),submittedAt:new Date()});
  const old=viewOf(await open());expect(old.archived).toBe(true);expect(old.result?.met).toBe(3);
  expect(viewOf(await open(true)).scenarioId).toBe("validate-option-print-practice-1");
  expect(await db.select().from(schema.lessonAttempt)).toHaveLength(2);
 });
 it("copies submitted source work and its exact case into recap, without crossing accounts",async()=>{
  const packet=await finish("cookbook-research-packet");
  expect(packet.result?.status).toBe("practiced");expect(packet.result?.unreviewed).toBe(3);
  const recap=viewOf(await openLearningImpl({lessonId:"market-recap",restart:false}));
  expect(recap.sourceWork?.attemptId).toBe(packet.attemptId);
  expect(recap.sourceWork?.evidence?.rows).toEqual(packet.work?.evidence?.rows);
  expect(recap.scenarioId).toBe("market-recap-practice-1");
  const before=recap.sourceWork;
  const saved=viewOf(await updateLearningImpl({...command(recap,{type:"hint"}),lessonId:"market-recap"}));
  expect(saved.sourceWork).toEqual(before);
  mocks.access.mockResolvedValue({access:{allowed:true},courseAccess:{userId:"learner-b"}});
  const other=viewOf(await openLearningImpl({lessonId:"market-recap",restart:false}));
  expect(other.sourceWork).toBeUndefined();
 });
 it("rejects forged results, invalid numeric input and unanswered submission without logging learner work",async()=>{
  const first=await decisionStart();
  expect(await updateLearningImpl(command(first,{type:"submit"}))).toEqual({ok:false,reason:"invalid_action"});
  expect(await updateLearningImpl(command(first,{type:"respond",questionId:"premium",value:"Infinity"}))).toEqual({ok:false,reason:"invalid_action"});
  expect(updateLearningSchema.safeParse({...command(first,{type:"hint"}),assessment:{status:"demonstrated"}}).success).toBe(false);
  expect(openLearningSchema.safeParse({lessonId,restart:false,clerkUserId:"other"}).success).toBe(false);
  expect(mocks.capture).not.toHaveBeenCalled();
 });
});
