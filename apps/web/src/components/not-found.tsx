import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
	const { t } = useI18n();
	return (
		<main
			className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-start justify-center gap-5 px-4 py-16 sm:px-6"
			aria-labelledby="not-found-title"
		>
			<p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.14em]">
				404
			</p>
			<h1
				id="not-found-title"
				className="font-semibold text-4xl text-display sm:text-5xl"
			>
				{t("common.notFound")}
			</h1>
			<p className="max-w-[55ch] text-muted-foreground leading-7">
				{t("common.notFoundDescription")}
			</p>
			<div className="flex flex-wrap gap-3">
				<Link to="/" className={buttonVariants()}>
					{t("common.returnHome")}
				</Link>
				<Link
					to="/courses/tradingflow-foundations"
					className={cn(buttonVariants({ variant: "outline" }))}
				>
					{t("common.returnCourse")}
				</Link>
			</div>
		</main>
	);
}
