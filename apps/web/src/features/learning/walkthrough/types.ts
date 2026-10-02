import type { ComponentType } from "react";
import type { Copy } from "@/content/world";
import type { Locale } from "@/i18n/messages";

export type Phase = "predict" | "watch" | "explore";

/**
 * A number the learner works out and types before watching. The prediction's choices stay
 * available as a fallback; a typed answer can't be recognised from a list.
 */
export type PredictionEntry = {
	answer: number;
	/** How far off still counts as right, in the answer's own units. */
	tolerance?: number;
	/** Written before the number, such as "$". */
	prefix?: string;
	/** Written after it, with any space it needs: [" contracts", " 张"], ["×", "×"]. */
	unit?: Copy;
};

/** One question asked before a scene plays, answered by a choice or a typed number. */
export type Prediction = {
	prompt: Copy;
	choices: readonly { id: string; label: Copy }[];
	answer: string;
	/** Shown once the beat that answers it is on screen. */
	explain: Copy;
	/** Index of the beat that reveals the answer; defaults to 1. */
	revealAt?: number;
	entry?: PredictionEntry;
};

/**
 * What the learner does in explore. "reach": get the example into a state, confirmed the
 * moment it happens. "answer": read something off the explored diagram.
 */
export type ExploreTask<E> =
	| {
			kind: "reach";
			prompt: Copy;
			reached: (explore: E) => boolean;
			/** Why that state answers the task, shown once reached. */
			done: Copy;
	  }
	| {
			kind: "answer";
			prompt: Copy;
			choices: readonly { id: string; label: Copy }[];
			answer: string;
			done: Copy;
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
		task?: ExploreTask<E>;
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
