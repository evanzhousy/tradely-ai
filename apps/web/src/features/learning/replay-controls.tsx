import { Button } from "@tradely/ui/components/button";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useId } from "react";
import { replayTime } from "@/domain/learning/contract-replay";
import type {
	ContractNeighborhood,
	ReplayClock,
} from "@/domain/learning/contracts";
import type { Locale } from "@/i18n/messages";
import { contractCopy } from "./contract-copy";

export function ReplayControls({
	data,
	clock,
	position,
	reducedMotion,
	locale,
	play,
	pause,
	seek,
	setRate,
}: {
	data: ContractNeighborhood;
	clock: ReplayClock;
	position: number;
	reducedMotion: boolean;
	locale: Locale;
	play: () => void;
	pause: () => void;
	seek: (position: number) => void;
	setRate: (rate: number) => void;
}) {
	const id = useId();
	const text = (key: keyof typeof contractCopy) => contractCopy[key][locale];
	if (!data.replay) return null;
	return (
		<section className="flex flex-col gap-3" aria-label={text("replayTitle")}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-muted-foreground text-xs">{text("replayTitle")}</p>
					<p className="font-mono text-2xl tabular-nums" data-replay-time>
						{replayTime(data, position)}{" "}
						<span className="text-muted-foreground text-sm">ET</span>
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						onClick={clock.playing ? pause : play}
						aria-label={text(
							clock.playing
								? "pauseReplay"
								: position >= 1
									? "replayAgain"
									: "playReplay",
						)}
					>
						{clock.playing ? (
							<PauseIcon data-icon="inline-start" />
						) : (
							<PlayIcon data-icon="inline-start" />
						)}
						{text(
							clock.playing
								? "pauseReplay"
								: position >= 1
									? "replayAgain"
									: "playReplay",
						)}
					</Button>
					<NativeSelect
						aria-label={text("replaySpeed")}
						value={clock.rate}
						onChange={(event) => setRate(Number(event.target.value))}
					>
						{[0.5, 1, 2].map((rate) => (
							<NativeSelectOption key={rate} value={rate}>
								{rate}×
							</NativeSelectOption>
						))}
					</NativeSelect>
				</div>
			</div>
			<Field>
				<FieldLabel htmlFor={`${id}-timeline`} className="sr-only">
					{text("replayTimeline")}
				</FieldLabel>
				<input
					id={`${id}-timeline`}
					type="range"
					min={0}
					max={1000}
					step={1}
					value={Math.round(position * 1000)}
					onPointerDown={pause}
					onKeyDown={(event) => {
						if (
							[
								"ArrowLeft",
								"ArrowRight",
								"Home",
								"End",
								"PageUp",
								"PageDown",
							].includes(event.key)
						)
							pause();
					}}
					onChange={(event) => seek(Number(event.target.value) / 1000)}
					aria-valuetext={`${replayTime(data, position)} ET`}
					className="h-11 w-full cursor-pointer accent-primary"
				/>
			</Field>
			<div className="flex justify-between gap-1">
				{data.replay.frames.map((frame) => (
					<Button
						key={frame.position}
						variant="ghost"
						size="sm"
						onClick={() => seek(frame.position)}
						className="min-w-0 px-1 font-mono tabular-nums"
						aria-label={`${text("seekTo")} ${replayTime(data, frame.position)} ET`}
					>
						{replayTime(data, frame.position)}
					</Button>
				))}
			</div>
			<p className="text-muted-foreground text-xs">{text("replayNote")}</p>
			{reducedMotion ? (
				<p className="text-muted-foreground text-xs">{text("reducedReplay")}</p>
			) : null}
		</section>
	);
}
