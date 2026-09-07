import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useCallback, useState } from "react";
import type { NeighborhoodPair } from "@/domain/learning/contracts";
import type { Locale } from "@/i18n/messages";
import {
	ContractExplorer,
	type ContractRenderer,
	type RendererChange,
} from "./contract-explorer";

export function NeighborhoodComparison({
	data,
	locale,
	allowThree = true,
	onRendererChange,
}: {
	data: NeighborhoodPair;
	locale: Locale;
	allowThree?: boolean;
	onRendererChange?: RendererChange;
}) {
	const [index, setIndex] = useState(0);
	const [renderer, setRenderer] = useState<ContractRenderer>("2d");
	const changeRenderer = useCallback<RendererChange>(
		(next, reason) => {
			setRenderer(next);
			onRendererChange?.(next, reason);
		},
		[onRendererChange],
	);
	const selected = data.cases[index];
	return (
		<section
			className="flex min-w-0 flex-col gap-4"
			aria-label={locale === "zh" ? "比较邻域" : "Compare neighborhoods"}
		>
			<ToggleGroup
				value={[String(index)]}
				onValueChange={(values) => {
					if (values[0]) setIndex(Number(values[0]));
				}}
				aria-label={locale === "zh" ? "比较案例" : "Comparison case"}
			>
				{data.cases.map((item, index) => (
					<ToggleGroupItem key={item.data.id} value={String(index)}>
						{item.label[locale]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<ContractExplorer
				key={selected.data.id}
				data={selected.data}
				locale={locale}
				autoPlay={false}
				initialRenderer={renderer}
				allowThree={allowThree}
				onRendererChange={changeRenderer}
			/>
		</section>
	);
}
