import { Link } from "@tanstack/react-router";
import { cn } from "@tradely/ui/lib/utils";

import { useI18n } from "@/i18n/provider";

interface TradelyBrandProps {
	compactOnMobile?: boolean;
}

export function TradelyBrand({ compactOnMobile = false }: TradelyBrandProps) {
	const { t } = useI18n();
	return (
		<Link
			to="/"
			className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
			aria-label={t("brand.home")}
		>
			<img
				src="/brand/tradely-mark-128.png"
				alt=""
				width={128}
				height={128}
				className="size-9 rounded-lg shadow-sm ring-1 ring-foreground/10"
				aria-hidden="true"
			/>
			<span
				className={cn(
					"items-baseline gap-1.5",
					compactOnMobile ? "hidden sm:inline-flex" : "inline-flex",
				)}
			>
				<span className="font-semibold text-foreground text-lg tracking-[-0.025em]">
					Tradely
				</span>
				<span className="font-medium font-mono text-[11px] text-muted-foreground">
					.ai
				</span>
			</span>
		</Link>
	);
}
