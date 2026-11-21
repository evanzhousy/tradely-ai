import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { PageIntro } from "@/components/page-intro";
import { ScrollProgress } from "@/components/scroll-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { CONNECTOR_URL, getConnectorPage } from "@/content/connector";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/connector")({
	head: ({ matches }) => pageHead("/connector", matches),
	component: ConnectorPage,
});

/** How to add Tradely's MCP connector to an AI assistant, and what it does. */
function ConnectorPage() {
	const { locale } = useI18n();
	const article = useRef<HTMLElement>(null);
	const page = getConnectorPage(locale);
	return (
		<main className="page-shell" aria-labelledby="connector-title">
			<ScrollProgress
				target={article}
				label={locale === "zh" ? "阅读进度" : "Reading progress"}
			/>
			<article ref={article} className="legal-prose">
				<PageIntro
					id="connector-title"
					eyebrow={page.eyebrow}
					title={page.title}
					description={page.intro}
				>
					<p className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-muted-foreground">{page.addressLabel}</span>
						<code className="rounded-md bg-muted px-2 py-1 font-mono">
							{CONNECTOR_URL}
						</code>
					</p>
				</PageIntro>
				<div className="reading-layout mt-10">
					<TableOfContents
						label={locale === "zh" ? "本页内容" : "On this page"}
						items={page.sections.map((section, index) => ({
							id: `connector-section-${index}`,
							title: section.heading,
						}))}
					/>
					<div className="reading-body">
						{page.sections.map((section, index) => (
							<section
								key={section.heading}
								className="reading-section flex flex-col gap-3"
								aria-labelledby={`connector-section-${index}`}
							>
								<h2
									id={`connector-section-${index}`}
									className="font-semibold text-2xl text-display"
								>
									{section.heading}
								</h2>
								{section.bullets ? (
									<ul>
										{section.bullets.map((bullet) => (
											<li key={bullet}>{bullet}</li>
										))}
									</ul>
								) : null}
								{section.paragraphs?.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
								{section.code ? (
									<pre className="overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-sm">
										<code>{section.code}</code>
									</pre>
								) : null}
								{section.link ? (
									<p>
										<Link
											to={section.link.href}
											className="font-medium underline underline-offset-4"
										>
											{section.link.label}
										</Link>
									</p>
								) : null}
							</section>
						))}
					</div>
				</div>
			</article>
		</main>
	);
}
