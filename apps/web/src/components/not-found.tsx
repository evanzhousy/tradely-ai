import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { DotPattern } from "@tradely/ui/components/dot-pattern";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@tradely/ui/components/empty";
import { cn } from "@tradely/ui/lib/utils";
import { useI18n } from "@/i18n/provider";
import { BrandOwl } from "./brand-owl";

export default function NotFound() {
	const { t } = useI18n();
	return (
		<main className="state-page" aria-labelledby="not-found-title">
			<DotPattern />
			<Empty>
				<EmptyHeader>
					<div className="flex flex-col items-center gap-2">
						<BrandOwl pose="curious" size={160} />
						<span className="font-mono text-muted-foreground text-sm">404</span>
					</div>
					<h1
						id="not-found-title"
						className="font-semibold text-4xl text-display sm:text-5xl"
					>
						{t("common.notFound")}
					</h1>
					<EmptyDescription>{t("common.notFoundDescription")}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Link to="/" className={buttonVariants()}>
						{t("common.returnHome")}
					</Link>
					<Link
						to="/courses/tradingflow-foundations"
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						{t("common.returnCourse")}
					</Link>
				</EmptyContent>
			</Empty>
		</main>
	);
}
