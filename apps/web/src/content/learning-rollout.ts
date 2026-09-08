import type { LearningCopy } from "@/domain/learning/types";
import { syllabus } from "./syllabus";

/** Public catalog only. Authored cases and rubrics remain in server-only modules. */
export const learningRollout: Readonly<Record<string, {
 presentation: "supplemental" | "primary"; three: boolean; showEvidenceLinks?: boolean; title: LearningCopy; intro: LearningCopy;
}>> = Object.fromEntries(syllabus.map(lesson => [lesson.id, {
 presentation: "primary" as const,
 three: ["rank-contracts", "gamma-exposure"].includes(lesson.id),
 title: { en: lesson.title, zh: lesson.titleZh },
 intro: { en: lesson.summary, zh: lesson.summaryZh },
}]));
