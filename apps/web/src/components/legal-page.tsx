import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import { getLegalDocument, type LegalPageId } from "@/content/legal";
import { useI18n } from "@/i18n/provider";

export function LegalPage({ page }: { page: LegalPageId }) {
	const { locale, t } = useI18n();
	const document = getLegalDocument(page, locale);
	return (
		<main
			className="mx-auto w-full max-w-[980px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
			aria-labelledby="legal-title"
		>
			<Link
				to="/"
				className={cn(
					buttonVariants({ variant: "ghost", size: "sm" }),
					"mb-8 -ml-3",
				)}
			>
				<ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
				{t("legal.backToLearning")}
			</Link>
			<article className="legal-prose">
				<header className="mb-12 flex max-w-3xl flex-col gap-4">
					<h1
						id="legal-title"
						className="font-semibold text-4xl text-display sm:text-5xl"
					>
						{document.title}
					</h1>
					<p className="text-lg text-muted-foreground leading-8">
						{document.intro}
					</p>
					<p className="font-mono text-muted-foreground text-xs">
						{document.lastUpdated}
					</p>
				</header>
				<div className="flex flex-col gap-10">
					{document.sections.map((section, index) => (
						<section
							key={section.heading}
							className="flex flex-col gap-3"
							aria-labelledby={`legal-section-${index}`}
						>
							<h2
								id={`legal-section-${index}`}
								className="font-semibold text-2xl text-display"
							>
								{section.heading}
							</h2>
							{section.paragraphs?.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
							{section.bullets ? (
								<ul>
									{section.bullets.map((bullet) => (
										<li key={bullet}>{bullet}</li>
									))}
								</ul>
							) : null}
						</section>
					))}
				</div>
			</article>
		</main>
	);
}
