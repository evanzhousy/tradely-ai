import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start/server-only", () => ({}));
import { tradingFlowCourse } from "@/content/course";
import { getLessonScenarios, getScenario } from "@/content/scenarios/index.server";
import { unitScenarios } from "@/content/units/authoring.server";
import { getTeachingUnit, teachingUnits } from "@/content/units/index.server";
import { assessAttempt, initialAttemptState, projectAttempt, transitionAttempt } from "./engine";
import { referenceAction } from "./test-helpers";
import { attemptStateSchema, numericResponse, type LearningAction } from "./types";

describe("expanded concept curriculum", () => {
	it("maps all 36 lessons and all 30 coverage families to authored teaching and distinct evaluation cases", () => {
		expect(teachingUnits).toHaveLength(36);
		expect(new Set(teachingUnits.map(unit => unit.id))).toEqual(new Set(tradingFlowCourse.lessons.map(lesson => lesson.id)));
		expect(new Set(tradingFlowCourse.lessons.flatMap(lesson => lesson.concepts ?? []))).toEqual(new Set(Array.from({length:30},(_,i)=>`C${String(i+1).padStart(2,"0")}`)));
		for (const unit of teachingUnits) {
			for (const field of [unit.explanation, unit.example, unit.misconception]) { expect(field.en.length).toBeGreaterThan(35); expect(field.zh.length).toBeGreaterThan(12); }
			const evaluation=unitScenarios(unit,"evaluation")[0];
			expect(getScenario(unit.id,evaluation.id,evaluation.version)).toBeUndefined();
			expect(getLessonScenarios(unit.id)).toHaveLength(2);
			for(const practice of getLessonScenarios(unit.id)) expect({brief:practice.steps.at(-1)?.brief, worksheet:practice.steps.at(-1)?.worksheet, metrics:practice.steps.at(-1)?.metrics}).not.toEqual({brief:evaluation.steps.at(-1)?.brief, worksheet:evaluation.steps.at(-1)?.worksheet, metrics:evaluation.steps.at(-1)?.metrics});
		}
	});
	it("keeps the known financial calculations and units correct", () => {
		const answer=(id:string,variant:number,q:string)=>Number(getTeachingUnit(id)!.case(variant).questions.find(item=>item.id===q)?.accepted[0]);
		expect(answer("premium-payoff",2,"profit")).toBe(-600);
		expect(answer("expiration-settlement",2,"settlement-difference")).toBe(-10);
		expect(answer("expiration-settlement",2,"cash")).toBe(0);
		expect(answer("session-flow-vs-structure",2,"volume")).toBe(40);
		expect(answer("session-flow-vs-structure",2,"ending-oi")).toBe(496);
		expect(answer("dex-dei-gex",1,"net")).toBe(-30000);
		expect(answer("dex-dei-gex",1,"dei")).toBe(2);
		expect(answer("gamma-exposure",1,"net")).toBe(-20);
		expect(answer("gamma-exposure",1,"gross")).toBe(180);
		expect(answer("cookbook-research-packet",1,"observed-premium")).toBe(108000);
		expect(answer("portfolio-pnl",1,"realized")).toBe(-60);
		expect(answer("portfolio-pnl",1,"unrealized")).toBe(270);
	});
	it("tests both aggressors, all five quote locations and all four sentiment combinations",()=>{
		expect(getTeachingUnit("execution-counterparties")!.case(1).questions[1].accepted).toEqual(["buyer"]);
		expect(getTeachingUnit("execution-counterparties")!.case(2).questions[1].accepted).toEqual(["seller"]);
		for(const variant of [1,2,3]) {
			const side=getTeachingUnit("execution-side")!.case(variant);
			expect(new Set(side.questions.filter(q=>q.id.startsWith("location-")).flatMap(q=>q.accepted))).toEqual(new Set(["ASK","AASK","MID","BID","BBID"]));
			const sentiment=getTeachingUnit("flow-sentiment")!.case(variant);
			for(const [i,row] of sentiment.worksheet!.rows.entries()) {
				const expected=(row[1]==="CALL") === (row[2]==="ASK") ? "bull":"bear";
				expect(sentiment.questions[i].accepted).toEqual([expected]);
			}
		}
	});
	it("cannot certify any current or evaluation case by a fixed answer position, zero arithmetic and blind prose",()=>{
		for(const unit of teachingUnits) for(const scenario of [...unitScenarios(unit),...unitScenarios(unit,"evaluation")]) for(let position=0;position<5;position++) {
			let state=initialAttemptState();
			for(const step of scenario.steps) {
				for(const question of step.questions) {
					const action:LearningAction=question.input ? {type:"respond",questionId:question.id,value:question.input.kind==="number"?"0":"Blind response with no source inspection. ".repeat(12)} : {type:"answer",questionId:question.id,choiceId:question.choices[Math.min(position,question.choices.length-1)].id};
					state=transitionAttempt(scenario,state,action);
				}
				state=transitionAttempt(scenario,state,{type:"submit"});
				if(state.phase!=="complete")state=transitionAttempt(scenario,state,{type:"continue"});
			}
			expect(assessAttempt(scenario,state)?.status,`${scenario.id}, position ${position+1}`).not.toBe("demonstrated");
		}
	});
	it("accepts familiar numeric notation, rejects non-numbers and does not leak numeric keys or auto-grade prose",()=>{
		expect(numericResponse("−2.5")).toBe(-2.5);expect(numericResponse("1,250.5")).toBe(1250.5);
		for(const bad of ["", "Infinity", "NaN", "1,25", "$12", "1e3", "0x10"])expect(numericResponse(bad)).toBeNull();
		const scenario=getLessonScenarios("cookbook-research-packet")[0];let state=initialAttemptState();
		state=transitionAttempt(scenario,state,{type:"continue"});
		const projected=JSON.stringify(projectAttempt(scenario,state,"id",1));
		expect(projected).not.toContain('"accepted"');expect(projected).not.toContain('"tolerance"');
		for(const step of scenario.steps.slice(1)) {
			for(const question of step.questions)state=transitionAttempt(scenario,state,referenceAction(question));
			state=transitionAttempt(scenario,state,{type:"submit"});
			if(state.phase!=="complete")state=transitionAttempt(scenario,state,{type:"continue"});
		}
		expect(assessAttempt(scenario,state)).toMatchObject({status:"practiced",unreviewed:3,met:1});
		expect(attemptStateSchema.parse(state)).toEqual(state);
	});
});
