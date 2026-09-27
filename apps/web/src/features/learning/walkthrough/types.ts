import type { ComponentType } from "react";
import type { Copy } from "@/content/world";
import type { Locale } from "@/i18n/messages";

export type Phase = "predict" | "watch" | "explore";

/** One question asked before a scene plays, answered by a gesture rather than typing. */
export type Prediction = {
	prompt: Copy;
	choices: readonly { id: string; label: Copy }[];
	answer: string;
	/** Shown once the beat that answers it is on screen. */
	explain: Copy;
	/** Index of the beat that reveals the answer; defaults to 1. */
	revealAt?: number;
};

/** One cause-and-effect step: a caption and the instrument state it shows. */
export type Beat<S> = {
	id: string;
	label: Copy;
	caption: Copy;
	state: S;
};

export type SceneViewProps<S, E> = {
	locale: Locale;
	phase: Phase;
	beat: number;
	/** State of the current beat; in explore, the beat the learner left from. */
	state: S;
	explore: E | null;
	setExplore: (next: E) => void;
};

export type WalkthroughScene<S = unknown, E = unknown> = {
	id: string;
	label: Copy;
	title: Copy;
	predict?: Prediction;
	beats: readonly [Beat<S>, ...Beat<S>[]];
	explore?: {
		prompt: Copy;
		start: (last: S) => E;
	};
	View: ComponentType<SceneViewProps<S, E>>;
};

/** Keeps each scene's own state types while the player stores a mixed list. */
export function defineScene<S, E = never>(
	scene: WalkthroughScene<S, E>,
): WalkthroughScene {
	return scene as unknown as WalkthroughScene;
}

export type EvidenceKind =
	| "observed"
	| "calculated"
	| "modeled"
	| "inferred"
	| "unknown";

export type ResultItem = {
	id: string;
	label: string;
	value: string;
	/** Counts to `to` instead of swapping the text; `format(to)` must equal `value`. */
	tween?: { to: number; format: (value: number) => string };
	/** Extra line under the value, such as "was 100". */
	note?: string;
	tone?: "gain" | "loss" | "neutral";
	evidence?: EvidenceKind;
};
