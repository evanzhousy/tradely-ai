import { Link } from "@tanstack/react-router";
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
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

import { AuthControls } from "./auth-controls";
import { TradelyBrand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { primaryNavigation } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
	const locale = useLocale();
	return primaryNavigation.map((item) => (
		<Link
			key={item.to}
			to={item.to}
			className={cn(
				"font-medium text-muted-foreground text-sm transition-colors hover:text-foreground",
				mobile && "rounded-2xl px-3 py-3 text-base",
			)}
			activeProps={{ className: "text-foreground" }}
		>
			{t(locale, item.labelKey)}
		</Link>
	));
}

export default function Header() {
	const locale = useLocale();
	return (
		<header className="material-chrome sticky top-0 z-40 border-border/60 border-b">
			<div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-8">
					<TradelyBrand />
					<nav
						className="hidden items-center gap-6 md:flex"
						aria-label={t(locale, "primaryNav")}
					>
						<NavigationLinks />
					</nav>
				</div>

				<div className="flex items-center gap-1.5">
					<a
						href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=header"
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"hidden sm:inline-flex",
						)}
					>
						{t(locale, "openTradingFlow")}
						<ExternalLinkIcon data-icon="inline-end" />
					</a>
					<LanguageSwitcher />
					<ThemeToggle />
					<AuthControls />
					<Sheet>
						<SheetTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="md:hidden"
									aria-label={t(locale, "openMenu")}
								/>
							}
						>
							<MenuIcon />
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle>Tradely</SheetTitle>
								<SheetDescription>
									{t(locale, "sheetDescription")}
								</SheetDescription>
							</SheetHeader>
							<nav
								className="flex flex-col gap-1 px-3"
								aria-label={t(locale, "mobileNav")}
							>
								<NavigationLinks mobile />
								<a
									href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=mobile-menu"
									className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
								>
									{t(locale, "openTradingFlow")}
									<ExternalLinkIcon data-icon="inline-end" />
								</a>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
