import { Link } from "@tanstack/react-router";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

import { TradelyBrand } from "./brand";
import { primaryNavigation } from "./site-nav";

export function SiteFooter() {
	const locale = useLocale();
	return (
		<footer className="border-border/60 border-t">
			<div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
				<div className="flex flex-col gap-3">
					<TradelyBrand />
					<p className="max-w-[52ch] text-muted-foreground text-sm leading-6">
						{t(locale, "footerBlurb")}
					</p>
				</div>
				<nav
					className="flex flex-wrap items-center gap-x-5 gap-y-2"
					aria-label={t(locale, "footerNav")}
				>
					{primaryNavigation.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
						>
							{t(locale, item.labelKey)}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
}
