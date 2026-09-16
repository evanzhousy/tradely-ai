"use client";

import {
	type KeyboardEvent,
	type PointerEvent,
	useCallback,
	useRef,
	useState,
} from "react";

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export function snapSliderValue(
	next: number,
	min: number,
	max: number,
	step: number,
) {
	if (!(max > min)) return min;
	if (!(step > 0)) return clamp(next, min, max);
	const whole = Math.floor(Number(((max - min) / step).toFixed(6)));
	const lastWhole = Number((min + whole * step).toFixed(6));
	const grid = clamp(
		Math.round((next - min) / step) * step + min,
		min,
		lastWhole,
	);
	const snapped =
		lastWhole < max && Math.abs(next - max) <= Math.abs(next - grid)
			? max
			: grid;
	return Number(snapped.toFixed(6));
}

export interface SliderOptions {
	id?: string;
	value?: number;
	defaultValue?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	"aria-label"?: string;
	formatValueText?: (value: number) => string;
}

/** Shared value and input plumbing for the beUI range-slider presentation. */
export function useSlider({
	id,
	value,
	defaultValue = 0,
	onValueChange,
	min = 0,
	max = 100,
	step = 1,
	disabled = false,
	"aria-label": ariaLabel,
	formatValueText,
}: SliderOptions) {
	const trackRef = useRef<HTMLDivElement>(null);
	const sliderRef = useRef<HTMLElement | null>(null);
	const draggingRef = useRef(false);
	const [internal, setInternal] = useState(defaultValue);
	const [dragging, setDragging] = useState(false);
	const controlled = value !== undefined;
	const lo = min;
	const hi = max > min ? max : min;
	const stride = step > 0 ? step : 1;
	const current = clamp(controlled ? value : internal, lo, hi);
	const percent = hi > lo ? ((current - lo) / (hi - lo)) * 100 : 0;

	const commit = useCallback(
		(next: number) => {
			const clean = snapSliderValue(next, lo, hi, stride);
			if (!controlled) setInternal(clean);
			onValueChange?.(clean);
		},
		[controlled, hi, lo, onValueChange, stride],
	);

	const commitFromX = useCallback(
		(clientX: number) => {
			const rect = trackRef.current?.getBoundingClientRect();
			if (!rect || rect.width === 0) return;
			const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
			commit(lo + ratio * (hi - lo));
		},
		[commit, hi, lo],
	);

	const onPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (disabled) return;
			draggingRef.current = true;
			setDragging(true);
			event.currentTarget.setPointerCapture?.(event.pointerId);
			sliderRef.current?.focus({ preventScroll: true });
			commitFromX(event.clientX);
		},
		[commitFromX, disabled],
	);

	const onPointerMove = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (!draggingRef.current || disabled) return;
			commitFromX(event.clientX);
		},
		[commitFromX, disabled],
	);

	const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
		if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		draggingRef.current = false;
		setDragging(false);
	}, []);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>) => {
			if (disabled) return;
			const nextByKey: Record<string, number> = {
				ArrowRight: current + stride,
				ArrowUp: current + stride,
				ArrowLeft: current - stride,
				ArrowDown: current - stride,
				PageUp: current + stride * 10,
				PageDown: current - stride * 10,
				Home: lo,
				End: hi,
			};
			if (!(event.key in nextByKey)) return;
			event.preventDefault();
			commit(nextByKey[event.key]);
		},
		[commit, current, disabled, hi, lo, stride],
	);

	return {
		percent,
		dragging,
		min: lo,
		max: hi,
		step: stride,
		trackProps: {
			ref: trackRef,
			onPointerDown,
			onPointerMove,
			onPointerUp: endDrag,
			onPointerCancel: endDrag,
			onLostPointerCapture: endDrag,
		},
		sliderProps: {
			ref: (node: HTMLElement | null) => {
				sliderRef.current = node;
			},
			id,
			role: "slider" as const,
			tabIndex: disabled ? -1 : 0,
			"aria-label": ariaLabel,
			"aria-valuemin": lo,
			"aria-valuemax": hi,
			"aria-valuenow": current,
			"aria-valuetext": formatValueText?.(current),
			"aria-disabled": disabled || undefined,
			onKeyDown,
		},
	};
}
