import { Link, useRouterState } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@tradely/ui/components/sheet";
import { cn } from "@tradely/ui/lib/utils";
import { ExternalLinkIcon, MenuIcon } from "lucide-react";
import { useState } from "react";

import { useAnalytics } from "@/analytics/context";
import { useI18n } from "@/i18n/provider";
import { AuthControls } from "./auth-controls";
import { TradelyBrand } from "./brand";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
	{ to: "/", key: "nav.learn" },
	{ to: "/guides", key: "nav.guides" },
	{ to: "/courses/tradingflow-foundations", key: "nav.course" },
	{ to: "/pricing", key: "nav.pricing" },
] as const;

function NavigationLinks({
	mobile = false,
	onNavigate,
}: {
	mobile?: boolean;
	onNavigate?: () => void;
}) {
	const { t } = useI18n();
	return navigation.map((item) => (
		<Link
			key={item.to}
			to={item.to}
			onClick={onNavigate}
			activeOptions={{ exact: item.to === "/" }}
			className={cn(
				"font-medium text-muted-foreground text-sm transition-colors hover:text-foreground",
				mobile && "rounded-2xl px-3 py-3 text-base",
			)}
			activeProps={{ className: "text-foreground" }}
		>
			{t(item.key)}
		</Link>
	));
}

export default function Header() {
	const [menuOpen, setMenuOpen] = useState(false);
	const isHome = useRouterState({
		select: (state) => state.location.pathname === "/",
	});
	const { t } = useI18n();
	const { capture } = useAnalytics();
	return (
		<header
			className={cn(
				"material-chrome sticky top-0 z-40 border-border/60 border-b",
				isHome && "observatory-chrome observatory-surface",
			)}
		>
			<div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-8">
					<TradelyBrand compactOnMobile />
					<nav
						className="app-navigation hidden items-center gap-1 lg:flex"
						aria-label={t("nav.primary")}
					>
						<NavigationLinks />
					</nav>
				</div>

				<div className="flex items-center gap-0.5 sm:gap-1.5">
					<a
						href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=header"
						onClick={() =>
							capture("tradingflow_link_opened", { surface: "header" })
						}
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"hidden sm:inline-flex",
						)}
					>
						{t("nav.openTradingFlow")}
						<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
					</a>
					<LocaleSwitcher />
					<ThemeToggle />
					<AuthControls />
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="lg:hidden"
									aria-label={t("nav.openMenu")}
								/>
							}
						>
							<MenuIcon aria-hidden="true" />
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle>{t("nav.mobileTitle")}</SheetTitle>
								<SheetDescription>
									{t("nav.mobileDescription")}
								</SheetDescription>
							</SheetHeader>
							<nav
								className="flex flex-col gap-1 px-3"
								aria-label={t("nav.mobile")}
							>
								<NavigationLinks mobile onNavigate={() => setMenuOpen(false)} />
								<LocaleSwitcher />
								<a
									href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=mobile-menu"
									onClick={() =>
										capture("tradingflow_link_opened", { surface: "header" })
									}
									className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
								>
									{t("nav.openTradingFlow")}
									<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
								</a>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
