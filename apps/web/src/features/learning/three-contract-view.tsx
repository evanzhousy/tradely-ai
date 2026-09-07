import { Button } from "@tradely/ui/components/button";
import { RotateCcwIcon, RotateCwIcon } from "lucide-react";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
	ContractNeighborhood,
	ContractViewState,
} from "@/domain/learning/contracts";
import type { Locale } from "@/i18n/messages";
import { contractCopy } from "./contract-copy";
import type { ContractSceneController } from "./three/contract-scene";

function ThreeContractViewContent({
	data,
	state,
	locale,
	onSelect,
	onUnavailable,
	onReady,
}: {
	data: ContractNeighborhood;
	state: ContractViewState;
	locale: Locale;
	onSelect: (id: string) => void;
	onUnavailable: () => void;
	onReady?: () => void;
}) {
	const host = useRef<HTMLDivElement>(null);
	const controller = useRef<ContractSceneController | null>(null);
	const latest = useRef(state);
	const [ready, setReady] = useState(false);
	useLayoutEffect(() => {
		latest.current = state;
		controller.current?.update(state);
	}, [state]);
	useEffect(() => {
		let cancelled = false;
		setReady(false);
		import("./three/contract-scene")
			.then(({ mountContractScene }) => {
				if (cancelled || !host.current) return;
				const instance = mountContractScene(
					host.current,
					data,
					locale,
					onSelect,
					onUnavailable,
				);
				controller.current = instance;
				instance.update(latest.current);
				setReady(true);
				onReady?.();
			})
			.catch(() => {
				if (!cancelled) onUnavailable();
			});
		return () => {
			cancelled = true;
			controller.current?.dispose();
			controller.current = null;
		};
	}, [data, locale, onSelect, onUnavailable, onReady]);
	const text = (key: keyof typeof contractCopy) => contractCopy[key][locale];
	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div
				ref={host}
				role="img"
				className="relative h-[340px] w-full overflow-hidden rounded-2xl bg-muted/40 sm:h-[420px]"
				aria-label={text("title")}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!ready}
					onClick={() => controller.current?.rotate(1)}
				>
					<RotateCcwIcon data-icon="inline-start" />
					{text("left")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!ready}
					onClick={() => controller.current?.rotate(-1)}
				>
					<RotateCwIcon data-icon="inline-start" />
					{text("right")}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					disabled={!ready}
					onClick={() => controller.current?.reset()}
				>
					{text("reset")}
				</Button>
				{!ready ? (
					<span role="status" className="text-muted-foreground text-sm">
						{text("loading")}
					</span>
				) : null}
			</div>
			<p className="text-muted-foreground text-xs">{text("controls")}</p>
		</div>
	);
}

export const ThreeContractView = memo(ThreeContractViewContent);
