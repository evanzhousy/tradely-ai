import { Button } from "@tradely/ui/components/button";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MetricsComparison } from "@/domain/learning/metrics";
import type { Locale } from "@/i18n/messages";
import { contractCopy } from "./contract-copy";
import type { GexViewState, mountGexScene } from "./three/gex-scene";

export function ThreeGexView({
	data,
	state,
	locale,
	onSelect,
	onUnavailable,
}: {
	data: MetricsComparison;
	state: GexViewState;
	locale: Locale;
	onSelect: (id: string) => void;
	onUnavailable: () => void;
}) {
	const host = useRef<HTMLDivElement>(null);
	const scene = useRef<ReturnType<typeof mountGexScene> | null>(null);
	const latest = useRef(state);
	const [ready, setReady] = useState(false);
	useLayoutEffect(() => {
		latest.current = state;
		scene.current?.update(state);
	}, [state]);
	useEffect(() => {
		let cancelled = false;
		setReady(false);
		import("./three/gex-scene")
			.then(({ mountGexScene }) => {
				if (cancelled || !host.current) return;
				scene.current = mountGexScene(
					host.current,
					data,
					locale,
					onSelect,
					onUnavailable,
				);
				scene.current.update(latest.current);
				setReady(true);
			})
			.catch(() => {
				if (!cancelled) onUnavailable();
			});
		return () => {
			cancelled = true;
			scene.current?.dispose();
			scene.current = null;
		};
	}, [data, locale, onSelect, onUnavailable]);
	return (
		<div className="flex flex-col gap-3">
			<div
				ref={host}
				className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-muted/40"
				role="img"
				aria-label={
					locale === "zh"
						? "带符号 GEX：行权价、到期日和模型贡献。下表提供相同数据。"
						: "Signed GEX: strike, expiry and model contribution. Equivalent values in the table below."
				}
			/>
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!ready}
					onClick={() => scene.current?.rotate(1)}
				>
					{contractCopy.left[locale]}
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!ready}
					onClick={() => scene.current?.rotate(-1)}
				>
					{contractCopy.right[locale]}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					disabled={!ready}
					onClick={() => scene.current?.reset()}
				>
					{contractCopy.reset[locale]}
				</Button>
				{!ready ? (
					<span role="status">{contractCopy.loading[locale]}</span>
				) : null}
			</div>
		</div>
	);
}
