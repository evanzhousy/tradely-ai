import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useState,
} from "react";

export type VisualPlaybackState = {
	progress: number;
	epoch: number;
	playing: boolean;
	pause: () => void;
	seek: (progress: number) => void;
	toggle: () => void;
};
export const VisualPlayback = createContext<VisualPlaybackState | null>(null);
export const VisualLessonIdentity = createContext<string | null>(null);
export const VisualLocale = createContext<"en" | "zh">("en");

/** Authored example states drive the same calculations as direct exploration. */
export function useGuidedState<T>(
	initial: T,
	states: readonly T[],
): [T, Dispatch<SetStateAction<T>>] {
	const playback = useContext(VisualPlayback);
	const [override, setOverride] = useState<{ epoch: number; value: T } | null>(
		null,
	);
	const epoch = playback?.epoch ?? 0;
	const demonstrated =
		playback && states.length > 0
			? states[Math.round(playback.progress * (states.length - 1))]
			: initial;
	const value = override?.epoch === epoch ? override.value : demonstrated;
	const setValue: Dispatch<SetStateAction<T>> = (next) => {
		playback?.pause();
		setOverride((current) => {
			const previous = current?.epoch === epoch ? current.value : demonstrated;
			return {
				epoch,
				value:
					typeof next === "function"
						? (next as (value: T) => T)(previous)
						: next,
			};
		});
	};
	return [value, setValue];
}

export function VisualLocaleProvider({
	locale,
	children,
}: {
	locale: "en" | "zh";
	children: ReactNode;
}) {
	return <VisualLocale value={locale}>{children}</VisualLocale>;
}
