import { createContext, useContext } from "react";
import type { QuoteConceptData } from "@/domain/learning/quote-concept";
export const QuoteData = createContext<QuoteConceptData | null>(null);
export function useQuoteData() {
	const data = useContext(QuoteData);
	if (!data) throw new Error("Quote scenes require authorized teaching data");
	return data;
}
