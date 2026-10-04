import { type Copy, oct105CallBlock } from "@/content/world";

/** The 10:50 block: 500 Oct 18 105 calls at $2.15, with its quotes and paired leg. */
export const BLOCK = oct105CallBlock;
export const MULTIPLIER = 100;
/** Cents. */
export const PREMIUM = BLOCK.price * BLOCK.quantity * MULTIPLIER;
export const CONTRACT: Copy = [
	"ALFA Oct 18 105 call",
	"ALFA 10月18日 105 看涨",
];
/** The 105 calls bought less the 110 calls sold with them: the spread's cost a share, in cents. */
export const SPREAD_COST = BLOCK.price - BLOCK.pairedLeg.price;
