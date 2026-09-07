import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { BoxIcon, Grid2X2Icon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { sampleContractReplay } from "@/domain/learning/contract-replay";
import {
	type ContractNeighborhood,
	type ContractViewState,
	contractLayout,
	contractStatus,
	visibleContracts,
} from "@/domain/learning/contracts";
import type { Locale } from "@/i18n/messages";
import { contractCopy } from "./contract-copy";
import { ReplayControls } from "./replay-controls";
import { ThreeContractView } from "./three-contract-view";
import { useContractReplay } from "./use-contract-replay";

export type ContractRenderer = "2d" | "3d";
export type RendererChange = (
	renderer: ContractRenderer,
	reason: "selected" | "unavailable",
) => void;

/** Key this component by scenario + stage + snapshot ID: the snapshot is immutable. */
export function ContractExplorer({
	data,
	locale,
	allowThree = true,
	initialRenderer = "2d",
	autoPlay = true,
	onRendererChange,
}: {
	data: ContractNeighborhood;
	locale: Locale;
	allowThree?: boolean;
	initialRenderer?: ContractRenderer;
	autoPlay?: boolean;
	onRendererChange?: RendererChange;
}) {
	const [snapshot] = useState(data);
	const [renderer, setRenderer] = useState<ContractRenderer>(
		allowThree ? initialRenderer : "2d",
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [scopeOnly, setScopeOnly] = useState(false);
	const [expiry, setExpiry] = useState<number | null>(null);
	const [unavailable, setUnavailable] = useState(false);
	const [sceneReady, setSceneReady] = useState(false);
	const host = useRef<HTMLElement>(null);
	const didAutoplay = useRef(false);
	const playback = useContractReplay(
		snapshot,
		host,
		autoPlay && initialRenderer === "3d" ? 0 : 1,
	);
	const { clock, position, visible, reducedMotion, play, pause } = playback;
	const currentSnapshot = useMemo(
		() => sampleContractReplay(snapshot, position),
		[snapshot, position],
	);
	const sceneLoaded = useCallback(() => setSceneReady(true), []);
	useEffect(() => {
		if (
			autoPlay &&
			sceneReady &&
			visible &&
			!reducedMotion &&
			!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches &&
			renderer === "3d" &&
			!didAutoplay.current
		) {
			didAutoplay.current = true;
			play();
		}
	}, [autoPlay, sceneReady, visible, reducedMotion, renderer, play]);
	const startReplay = () => {
		didAutoplay.current = true;
		play();
	};
	const pauseReplay = () => {
		didAutoplay.current = true;
		pause();
	};
	const seekReplay = (position: number) => {
		didAutoplay.current = true;
		playback.seek(position);
	};
	const id = useId();
	const text = (key: keyof typeof contractCopy) => contractCopy[key][locale];
	const state = useMemo(
		() => ({ selectedId, scopeOnly, expiry, replay: clock }),
		[selectedId, scopeOnly, expiry, clock],
	);
	const layout = useMemo(() => contractLayout(snapshot), [snapshot]);
	const shown = visibleContracts(currentSnapshot, state);
	const selected = currentSnapshot.contracts.find(
		(contract) => contract.id === selectedId,
	);
	const expiries = layout.expiries.filter(
		(days) => expiry === null || days === expiry,
	);
	const fail = useCallback(() => {
		didAutoplay.current = true;
		pause();
		setUnavailable(true);
		setRenderer("2d");
		onRendererChange?.("2d", "unavailable");
	}, [onRendererChange, pause]);
	const changeView = (next: ContractRenderer) => {
		if (next === renderer) return;
		if (next === "3d" && autoPlay && !didAutoplay.current && !reducedMotion)
			playback.seek(0);
		setUnavailable(false);
		setRenderer(next);
		onRendererChange?.(next, "selected");
	};
	const filter = (next: ContractViewState) => {
		setScopeOnly(next.scopeOnly);
		setExpiry(next.expiry);
		if (
			!visibleContracts(snapshot, next).some(
				(contract) => contract.id === selectedId,
			)
		)
			setSelectedId(null);
	};
	const volume = (value: number | null) =>
		value === null ? "—" : value.toLocaleString(locale);
	return (
		<section
			ref={host}
			id="contract-neighborhood"
			className="flex min-w-0 flex-col gap-4"
			aria-labelledby={`${id}-heading`}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h4 id={`${id}-heading`} className="font-medium">
					{text("title")}
				</h4>
				{allowThree ? (
					<ToggleGroup
						value={[renderer]}
						variant="outline"
						onValueChange={(values) => {
							if (values[0] === "2d" || values[0] === "3d")
								changeView(values[0]);
						}}
						aria-label={text("view")}
					>
						<ToggleGroupItem value="2d">
							<Grid2X2Icon data-icon="inline-start" />
							{text("map")}
						</ToggleGroupItem>
						<ToggleGroupItem value="3d">
							<BoxIcon data-icon="inline-start" />
							{text("three")}
						</ToggleGroupItem>
					</ToggleGroup>
				) : null}
			</div>
			<FieldGroup className="sm:flex-row sm:items-end">
				<Field>
					<FieldTitle id={`${id}-scope`}>{text("visibility")}</FieldTitle>
					<ToggleGroup
						value={[scopeOnly ? "scope" : "all"]}
						onValueChange={(values) => {
							if (values.length)
								filter({ ...state, scopeOnly: values[0] === "scope" });
						}}
						aria-labelledby={`${id}-scope`}
					>
						<ToggleGroupItem value="all">{text("all")}</ToggleGroupItem>
						<ToggleGroupItem value="scope">{text("scope")}</ToggleGroupItem>
					</ToggleGroup>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${id}-expiry`}>{text("expiry")}</FieldLabel>
					<NativeSelect
						id={`${id}-expiry`}
						value={expiry ?? "all"}
						onChange={(event) =>
							filter({
								...state,
								expiry:
									event.target.value === "all"
										? null
										: Number(event.target.value),
							})
						}
					>
						<NativeSelectOption value="all">
							{text("allExpiries")}
						</NativeSelectOption>
						{layout.expiries.map((days) => (
							<NativeSelectOption key={days} value={days}>
								{days} {text("days")}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
			</FieldGroup>
			{unavailable ? (
				<Alert>
					<AlertDescription>{text("fallback")}</AlertDescription>
				</Alert>
			) : null}
			<ReplayControls
				data={snapshot}
				clock={clock}
				position={position}
				reducedMotion={reducedMotion}
				locale={locale}
				play={startReplay}
				pause={pauseReplay}
				seek={seekReplay}
				setRate={playback.setRate}
			/>
			{allowThree && renderer === "3d" ? (
				<ThreeContractView
					data={snapshot}
					state={state}
					locale={locale}
					onSelect={setSelectedId}
					onUnavailable={fail}
					onReady={sceneLoaded}
				/>
			) : null}
			<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
				<span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
				{text("comparable")}
				<span
					className="ml-2 size-2 rounded-full bg-muted-foreground"
					aria-hidden="true"
				/>
				{text("out_of_scope")} / {text("stale")}
			</div>
			<Table aria-label={text("volume")} className="table-fixed">
				<TableHeader>
					<TableRow>
						<TableHead className="p-1">{text("strike")}</TableHead>
						{expiries.map((days) => (
							<TableHead key={days} className="p-1 text-center">
								{days}d
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{layout.strikes.map((strike) => (
						<TableRow key={strike}>
							<TableHead scope="row" className="p-1">
								{strike}
							</TableHead>
							{expiries.map((days) => {
								const contract = shown.find(
									(item) => item.strike === strike && item.days === days,
								);
								if (!contract)
									return (
										<TableCell key={days} className="p-1 text-center">
											<span aria-hidden="true">·</span>
											<span className="sr-only">{text("out_of_scope")}</span>
										</TableCell>
									);
								const status = contractStatus(snapshot, contract);
								return (
									<TableCell key={days} className="p-1">
										<Button
											className="relative min-h-11 w-full min-w-0 gap-1 px-1 tabular-nums"
											variant={selectedId === contract.id ? "default" : "ghost"}
											aria-pressed={selectedId === contract.id}
											aria-label={`${snapshot.symbol} ${strike} ${text("call")}, ${days} ${text("days")}, ${volume(contract.volume)}, ${text(status)}`}
											onClick={() => setSelectedId(contract.id)}
										>
											{volume(contract.volume)}
											{status === "stale"
												? "†"
												: status === "out_of_scope"
													? "×"
													: ""}
											{contract.volume !== null &&
											selectedId !== contract.id ? (
												<span
													aria-hidden="true"
													className="absolute bottom-1 left-1 h-0.5 rounded-full"
													style={{
														width: "85%",
														transform: `scaleX(${contract.volume / layout.volumeMax})`,
														transformOrigin: "left",
														backgroundColor:
															status === "comparable"
																? "var(--chart-1)"
																: "var(--muted-foreground)",
													}}
												/>
											) : null}
										</Button>
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</Table>
			{shown.length === 0 ? (
				<p className="text-sm" role="status">
					{text("empty")}
				</p>
			) : null}
			<p className="text-muted-foreground text-xs">
				{text("volume")} · {text("legend")}
			</p>
			<div
				aria-live={clock.playing ? "off" : "polite"}
				role="status"
				className="flex min-h-20 flex-col gap-2"
			>
				{selected ? (
					<>
						<div className="flex flex-wrap items-center gap-2">
							<strong className="font-medium">
								{snapshot.symbol} {selected.strike} {text("call")} ·{" "}
								{selected.days} {text("days")}
							</strong>
							<Badge variant="secondary">
								{text(contractStatus(snapshot, selected))}
							</Badge>
						</div>
						<p className="text-sm tabular-nums">
							{text("volume")}:{" "}
							<span
								className="font-medium font-mono text-xl"
								data-selected-volume
							>
								{volume(selected.volume)}
							</span>{" "}
							· {selected.fresh ? currentSnapshot.asOf[locale] : text("stale")}
						</p>
					</>
				) : (
					<p className="text-muted-foreground text-sm">{text("select")}</p>
				)}
			</div>
			<p className="text-muted-foreground text-xs">{text("filters")}</p>
		</section>
	);
}
