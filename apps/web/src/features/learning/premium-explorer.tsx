import { Field, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";

export function PremiumExplorer({
	price,
	locale,
}: {
	price: number;
	locale: Locale;
}) {
	const [size, setSize] = useState(100);
	const id = useId();
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	return (
		<section
			className="flex flex-col gap-3"
			aria-label={text("Premium calculator", "权利金计算器")}
		>
			<Field>
				<FieldLabel htmlFor={id}>
					{text("What-if contract count", "假设合约数量")}
				</FieldLabel>
				<NativeSelect
					id={id}
					value={size}
					onChange={(event) => setSize(Number(event.target.value))}
				>
					{[100, 200, 500].map((size) => (
						<NativeSelectOption key={size} value={size}>
							{size}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</Field>
			<p role="status" className="font-mono text-sm">
				{"$"}
				{price.toFixed(2)} × {size} × 100 = {"$"}
				{(price * size * 100).toLocaleString(locale)}
			</p>
			<p className="text-muted-foreground text-xs">
				{text(
					"Quoted price per share × contract count × stated multiplier = total premium. This what-if calculation changes no execution facts or assessment answers.",
					"每股报价 × 合约数量 × 给定乘数 = 总权利金。假设计算不会改变成交事实或评估答案。",
				)}
			</p>
		</section>
	);
}
