import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	clampReplayPosition,
	replayPositionAt,
} from "@/domain/learning/contract-replay";
import type {
	ContractNeighborhood,
	ReplayClock,
} from "@/domain/learning/contracts";

export function useContractReplay(
	data: ContractNeighborhood,
	host: RefObject<HTMLElement | null>,
	initialPosition = 1,
) {
	const [clock, setClock] = useState<ReplayClock>({
		position: initialPosition,
		startedAt: 0,
		playing: false,
		rate: 2,
		stepOnly: false,
	});
	const clockRef = useRef(clock);
	const [position, setPosition] = useState(initialPosition);
	const [visible, setVisible] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);
	const reducedRef = useRef(false);
	const commit = useCallback((next: ReplayClock) => {
		clockRef.current = next;
		setClock(next);
		setPosition(next.position);
	}, []);
	const pause = useCallback(() => {
		const current = clockRef.current;
		if (!current.playing) return;
		const now = performance.now();
		commit({
			...current,
			position: replayPositionAt(data, current, now),
			startedAt: now,
			playing: false,
		});
	}, [commit, data]);
	const play = useCallback(() => {
		if (!data.replay || document.hidden) return;
		const current = clockRef.current;
		const now = performance.now();
		const at = replayPositionAt(data, current, now);
		commit({
			...current,
			position: at >= 1 ? 0 : at,
			startedAt: now,
			playing: true,
			stepOnly:
				window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
				reducedRef.current,
		});
	}, [commit, data]);
	const seek = useCallback(
		(next: number) => {
			commit({
				...clockRef.current,
				position: clampReplayPosition(next),
				startedAt: performance.now(),
				playing: false,
			});
		},
		[commit],
	);
	const setRate = useCallback(
		(rate: number) => {
			if (![0.5, 1, 2].includes(rate)) return;
			const current = clockRef.current;
			const now = performance.now();
			commit({
				...current,
				position: replayPositionAt(data, current, now),
				startedAt: now,
				rate,
			});
		},
		[commit, data],
	);
	useEffect(() => {
		if (!clock.playing) return;
		let frame = 0;
		let active = true;
		let lastUi = Number.NEGATIVE_INFINITY;
		const tick = (now: number) => {
			if (!active || clockRef.current !== clock) return;
			const at = replayPositionAt(data, clock, now);
			if (at >= 1) {
				commit({ ...clock, position: 1, playing: false, startedAt: now });
				return;
			}
			// Cap numeric DOM updates at 30fps; Three.js samples the same origin at display rate.
			if (now - lastUi >= 1000 / 30) {
				setPosition(at);
				lastUi = now;
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => {
			active = false;
			cancelAnimationFrame(frame);
		};
	}, [clock, commit, data]);
	useEffect(() => {
		const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		let firstPreference = true;
		const preference = () => {
			reducedRef.current = media?.matches ?? false;
			setReducedMotion(reducedRef.current);
			if (reducedRef.current) {
				if (!clockRef.current.stepOnly) pause();
				if (
					firstPreference &&
					clockRef.current.startedAt === 0 &&
					clockRef.current.position === 0
				)
					seek(1);
			}
			firstPreference = false;
		};
		preference();
		media?.addEventListener("change", preference);
		let intersects = false;
		const visibility = () => {
			const shown = intersects && !document.hidden;
			setVisible(shown);
			if (!shown) pause();
		};
		const node = host.current;
		let observer: IntersectionObserver | undefined;
		if (node && typeof IntersectionObserver !== "undefined") {
			observer = new IntersectionObserver(([entry]) => {
				intersects = entry?.isIntersecting ?? false;
				visibility();
			});
			observer.observe(node);
		} else {
			intersects = true;
			visibility();
		}
		document.addEventListener("visibilitychange", visibility);
		return () => {
			observer?.disconnect();
			document.removeEventListener("visibilitychange", visibility);
			media?.removeEventListener("change", preference);
		};
	}, [host, pause, seek]);
	return {
		clock,
		position,
		visible,
		reducedMotion,
		play,
		pause,
		seek,
		setRate,
	};
}
