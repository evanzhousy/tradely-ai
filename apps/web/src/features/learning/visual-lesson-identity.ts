import { createContext } from "react";

/** The lesson a walkthrough belongs to, for its scene bookmark and analytics. */
export const VisualLessonIdentity = createContext<string | null>(null);
