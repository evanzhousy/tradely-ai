import type { Transition } from "motion/react";
import * as m from "motion/react-m";
import { type PointerEvent, useRef, useState } from "react";

/**
 * Lets the reader drag a marker along a price axis by pressing anywhere on the drawing.
 * The lesson owns the value, and a range control stays the keyboard path to it.
 */
export type AxisDrag = {
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
};

/**
 * Pointer handling for an axis drag. `toValue` turns a drawing x into an axis value, which
 * is snapped to the step and kept in range. A touch waits until it moves sideways, so taps
 * and scrolls leave the marker where it was.
 */
export function useAxisDrag(
	drag: AxisDrag | undefined,
	toValue: (x: number) => number,
) {
	const [dragging, setDragging] = useState(false);
	const reported = useRef<number | null>(null);
	/** Where a touch began, until it moves sideways enough to be a drag rather than a scroll. */
	const touchFrom = useRef<{ x: number; y: number } | null>(null);
	const report = (event: PointerEvent<SVGGraphicsElement>) => {
		const ctm = event.currentTarget.getScreenCTM();
		if (!drag || !ctm) return;
		const x = new DOMPoint(event.clientX, event.clientY).matrixTransform(
			ctm.inverse(),
		).x;
		const snapped =
			drag.min + Math.round((toValue(x) - drag.min) / drag.step) * drag.step;
		const next = Number(
			Math.min(drag.max, Math.max(drag.min, snapped)).toFixed(6),
		);
		if (next === reported.current) return;
		reported.current = next;
		drag.onChange(next);
	};
	const release = () => {
		reported.current = null;
		touchFrom.current = null;
		setDragging(false);
	};
	return {
		dragging,
		/** Props for the transparent shape that takes the presses. */
		area: {
			className: "wt-drag-area",
			"data-dragging": dragging || undefined,
			onPointerDown: (event: PointerEvent<SVGGraphicsElement>) => {
				if (event.button !== 0) return;
				event.currentTarget.setPointerCapture(event.pointerId);
				setDragging(true);
				if (event.pointerType === "touch")
					touchFrom.current = { x: event.clientX, y: event.clientY };
				else report(event);
			},
			onPointerMove: (event: PointerEvent<SVGGraphicsElement>) => {
				if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
				const from = touchFrom.current;
				if (from) {
					const dx = Math.abs(event.clientX - from.x);
					if (dx < 6 || dx < Math.abs(event.clientY - from.y)) return;
					touchFrom.current = null;
				}
				report(event);
			},
			onPointerUp: release,
			onPointerCancel: release,
			onLostPointerCapture: release,
		},
	};
}

/** A soft ring and side chevrons around a draggable marker, saying it slides sideways. */
export function DragHandle({
	cx,
	cy,
	r,
	dragging,
	transition,
}: {
	cx: number;
	cy: number;
	r: number;
	dragging: boolean;
	transition: Transition;
}) {
	return (
		<>
			<m.circle
				r={r}
				className="wt-drag-ring"
				data-dragging={dragging || undefined}
				initial={false}
				animate={{ cx, cy }}
				transition={transition}
			/>
			<m.path
				className="wt-drag-chevron"
				initial={false}
				animate={{
					d: `M${cx - r - 4} ${cy - 4}l-4 4 4 4M${cx + r + 4} ${cy - 4}l4 4-4 4`,
				}}
				transition={transition}
			/>
		</>
	);
}
