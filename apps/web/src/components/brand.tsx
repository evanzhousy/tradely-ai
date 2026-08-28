import { Link } from "@tanstack/react-router";

import { useI18n } from "@/i18n/provider";

export function TradelyBrand() {
	const { t } = useI18n();
	return (
		<Link
			to="/"
			className="inline-flex items-baseline gap-1.5"
			aria-label={t("brand.home")}
		>
			<span className="font-semibold text-foreground text-lg tracking-[-0.025em]">
				Tradely
			</span>
			<span className="font-medium font-mono text-[11px] text-muted-foreground">
				.ai
			</span>
		</Link>
	);
}
