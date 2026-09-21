import { Link, useRouterState } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { Drawer } from "@tradely/ui/components/drawer";
import { Link as HeroLink } from "@tradely/ui/components/link";
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
			activeProps={{ className: "text-foreground", "aria-current": "page" }}
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
					<HeroLink
						href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=header"
						onClick={() =>
							capture("tradingflow_link_opened", { surface: "header" })
						}
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"hidden sm:inline-flex",
						)}
					>
						<img
							src="/partners/tradingflow-mark.webp"
							alt=""
							width={64}
							height={64}
							className="size-4 rounded-[4px]"
							aria-hidden="true"
						/>
						{t("nav.openTradingFlow")}
						<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
					</HeroLink>
					<LocaleSwitcher />
					<ThemeToggle />
					<AuthControls />
					<Drawer.Root isOpen={menuOpen} onOpenChange={setMenuOpen}>
						<Drawer.Trigger
							className={cn(
								buttonVariants({ variant: "ghost", size: "icon" }),
								"lg:hidden",
							)}
							aria-label={t("nav.openMenu")}
						>
							<MenuIcon aria-hidden="true" />
						</Drawer.Trigger>
						<Drawer.Backdrop>
							<Drawer.Content placement="right">
								<Drawer.Dialog>
									<Drawer.CloseTrigger aria-label={t("common.close")} />
									<Drawer.Header>
										<Drawer.Heading>{t("nav.mobileTitle")}</Drawer.Heading>
										<p className="text-muted-foreground text-sm">
											{t("nav.mobileDescription")}
										</p>
									</Drawer.Header>
									<Drawer.Body>
										<nav
											className="flex flex-col gap-1"
											aria-label={t("nav.mobile")}
										>
											<NavigationLinks
												mobile
												onNavigate={() => setMenuOpen(false)}
											/>
											<LocaleSwitcher />
											<HeroLink
												href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=mobile-menu"
												onClick={() =>
													capture("tradingflow_link_opened", {
														surface: "header",
													})
												}
												className={cn(
													buttonVariants({ variant: "outline" }),
													"mt-4",
												)}
											>
												<img
													src="/partners/tradingflow-mark.webp"
													alt=""
													width={64}
													height={64}
													className="size-4 rounded-[4px]"
													aria-hidden="true"
												/>
												{t("nav.openTradingFlow")}
												<ExternalLinkIcon
													data-icon="inline-end"
													aria-hidden="true"
												/>
											</HeroLink>
										</nav>
									</Drawer.Body>
								</Drawer.Dialog>
							</Drawer.Content>
						</Drawer.Backdrop>
					</Drawer.Root>
				</div>
			</div>
		</header>
	);
}
