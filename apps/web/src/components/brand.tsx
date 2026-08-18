import { Link } from "@tanstack/react-router";

export function TradelyBrand() {
	return (
		<Link
			to="/"
			className="inline-flex items-baseline gap-1.5"
			aria-label="Tradely home"
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
