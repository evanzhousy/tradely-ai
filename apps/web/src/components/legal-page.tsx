import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@tradely/ui/components/breadcrumb";
import { useRef } from "react";
import { getLegalDocument, type LegalPageId } from "@/content/legal";
import { useI18n } from "@/i18n/provider";
import { PageIntro } from "./page-intro";
import { ScrollProgress } from "./scroll-progress";
import { TableOfContents } from "./table-of-contents";

export function LegalPage({ page }: { page: LegalPageId }) {
	const { locale, t } = useI18n();
	const article = useRef<HTMLElement>(null);
	const document = getLegalDocument(page, locale);
	return (
		<main className="page-shell" aria-labelledby="legal-title">
			<ScrollProgress target={article} />
			<Breadcrumb aria-label={locale === "zh" ? "页面路径" : "Breadcrumb"}>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink render={<Link to="/" />}>
							{t("nav.learn")}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{document.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<article ref={article} className="legal-prose">
				<PageIntro
					id="legal-title"
					eyebrow={t("footer.legal")}
					title={document.title}
					description={document.intro}
				>
					<p className="font-mono text-muted-foreground text-xs">
						{document.lastUpdated}
					</p>
				</PageIntro>
				<div className="reading-layout mt-10">
					<TableOfContents
						label={locale === "zh" ? "本页内容" : "On this page"}
						items={document.sections.map((section, index) => ({
							id: `legal-section-${index}`,
							title: section.heading,
						}))}
					/>
					<div className="reading-body">
						{document.sections.map((section, index) => (
							<section
								key={section.heading}
								className="reading-section flex flex-col gap-3"
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
				</div>
			</article>
		</main>
	);
}
