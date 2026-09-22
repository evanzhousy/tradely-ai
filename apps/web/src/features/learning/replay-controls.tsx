import { Button } from "@tradely/ui/components/button";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import { RangeSlider } from "@tradely/ui/components/slider";
import { Toolbar } from "@tradely/ui/components/toolbar";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useId } from "react";
import type { ReplayClock, ReplaySource } from "@/domain/learning/replay";
import { REPLAY_RATES, replayTime } from "@/domain/learning/replay";
import type { Locale } from "@/i18n/messages";
import { replayCopy } from "./replay-copy";

export function ReplayControls({
	data,
	note,
	clock,
	position,
	reducedMotion,
	locale,
	play,
	pause,
	seek,
	setRate,
}: {
	data: ReplaySource;
	note: { en: string; zh: string };
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
	const text = (key: keyof typeof replayCopy) => replayCopy[key][locale];
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
				<Toolbar
					aria-label={text("replayTitle")}
					className="flex flex-wrap items-center gap-2"
				>
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
						{REPLAY_RATES.map((rate) => (
							<NativeSelectOption key={rate} value={rate}>
								{rate}×
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Toolbar>
			</div>
			<Field>
				<FieldLabel htmlFor={`${id}-timeline`} className="sr-only">
					{text("replayTimeline")}
				</FieldLabel>
				<RangeSlider
					id={`${id}-timeline`}
					min={0}
					max={1000}
					step={1}
					value={Math.round(position * 1000)}
					aria-label={text("replayTimeline")}
					formatValueText={(value) => `${replayTime(data, value / 1000)} ET`}
					onValueChange={(value) => {
						pause();
						seek(value / 1000);
					}}
					className="h-11"
				/>
			</Field>
			<Toolbar
				aria-label={text("replayTimeline")}
				className="flex justify-between gap-1"
			>
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
			</Toolbar>
			<p className="text-muted-foreground text-xs">{note[locale]}</p>
			{reducedMotion ? (
				<p className="text-muted-foreground text-xs">{text("reducedReplay")}</p>
			) : null}
		</section>
	);
}
