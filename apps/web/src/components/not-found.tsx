import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { DotPattern } from "@tradely/ui/components/dot-pattern";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
} from "@tradely/ui/components/empty";
import { cn } from "@tradely/ui/lib/utils";
import { BookOpenIcon } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
	const { t } = useI18n();
	return (
		<main className="state-page" aria-labelledby="not-found-title">
			<DotPattern />
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="relative">
						<BookOpenIcon aria-hidden="true" />
						<span className="state-code">404</span>
					</EmptyMedia>
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
