import { Button } from "@tradely/ui/components/button";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { PauseIcon, PlayIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";

type Copy = (en: string, zh: string) => string;

export function Diagram({
	label,
	children,
	height = 340,
}: {
	label: string;
	children: ReactNode;
	height?: number;
}) {
	const id = useId();
	return (
		// biome-ignore lint/a11y/useSemanticElements: Interactive SVG contains native buttons; a fieldset cannot replace its coordinate system.
		<svg
			className="contract-diagram"
			viewBox={`0 0 360 ${height}`}
			role="group"
			aria-labelledby={id}
		>
			<title id={id}>{label}</title>
			{children}
		</svg>
	);
}
export function SvgText({
	x,
	y,
	children,
	muted = false,
	strong = false,
}: {
	x: number;
	y: number;
	children: ReactNode;
	muted?: boolean;
	strong?: boolean;
}) {
	return (
		<text
			x={x}
			y={y}
			textAnchor="middle"
			className={
				muted
					? "contract-svg-muted"
					: strong
						? "contract-svg-strong"
						: undefined
			}
		>
			{children}
		</text>
	);
}
export function SceneLayout({
	diagram,
	children,
}: {
	diagram: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="contract-scene-layout">
			<div className="contract-stage">{diagram}</div>
			<div className="flex min-w-0 flex-col gap-5">{children}</div>
		</div>
	);
}
export function SelectField({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: readonly (readonly [string, string])[];
	onChange: (value: string) => void;
}) {
	const id = useId();
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<NativeSelect
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			>
				{options.map(([key, text]) => (
					<NativeSelectOption key={key} value={key}>
						{text}
					</NativeSelectOption>
				))}
			</NativeSelect>
		</Field>
	);
}

/** Explicit playback visits supplied teaching states. It stops on direct input, hide, or unmount. */
export function useFrames(length: number) {
	const [frame, setFrame] = useState(0);
	const [playing, setPlaying] = useState(false);
	useEffect(() => {
		if (!playing) return;
		const stopOnHide = () => {
			if (document.hidden) setPlaying(false);
		};
		document.addEventListener("visibilitychange", stopOnHide);
		const timer = window.setTimeout(() => {
			if (frame < length - 1) setFrame((value) => value + 1);
			else setPlaying(false);
		}, 1200);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("visibilitychange", stopOnHide);
		};
	}, [frame, playing, length]);
	return {
		frame,
		playing,
		select: (value: number) => {
			setPlaying(false);
			setFrame(value);
		},
		toggle: () => {
			if (!playing && frame === length - 1) setFrame(0);
			setPlaying((value) => !value);
		},
	};
}
export function PlaybackButton({
	playing,
	onClick,
	l,
}: {
	playing: boolean;
	onClick: () => void;
	l: Copy;
}) {
	return (
		<Button variant="outline" size="sm" onClick={onClick}>
			{playing ? (
				<PauseIcon data-icon="inline-start" />
			) : (
				<PlayIcon data-icon="inline-start" />
			)}
			{playing ? l("Pause", "暂停") : l("Play explanation", "播放讲解")}
		</Button>
	);
}

export function ChoiceField<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: readonly (readonly [T, string])[];
	onChange: (value: T) => void;
}) {
	const id = useId();
	return (
		<Field>
			<FieldLabel id={id}>{label}</FieldLabel>
			<ToggleGroup
				aria-labelledby={id}
				value={[value]}
				onValueChange={(values) => {
					const option = options.find(([key]) => key === values[0]);
					if (option) onChange(option[0]);
				}}
				variant="outline"
				className="flex-wrap"
			>
				{options.map(([key, label]) => (
					<ToggleGroupItem key={key} value={key}>
						{label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</Field>
	);
}

export function RangeControl({
	label,
	value,
	display,
	min,
	max,
	step = 1,
	onChange,
}: {
	label: string;
	value: number;
	display: string;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<Field>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<output htmlFor={id} className="font-mono text-sm">
					{display}
				</output>
			</div>
			<input
				id={id}
				className="contract-range"
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				aria-valuetext={display}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
		</Field>
	);
}
