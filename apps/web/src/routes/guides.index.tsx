import { createFileRoute } from "@tanstack/react-router";
import { BrandOwl } from "@/components/brand-owl";
import { EnglishOnlyNote } from "@/components/english-only-note";
import { GuideCards } from "@/components/guide-cards";
import { PageIntro } from "@/components/page-intro";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/guides/")({
	head: ({ matches }) => pageHead("/guides", matches),
	component: GuidesPage,
});

function GuidesPage() {
	return (
		<main lang="en" className="page-shell">
			<EnglishOnlyNote />
			<PageIntro
				eyebrow="The options field guide"
				aside={<BrandOwl pose="reading" size={160} className="mx-auto" />}
				title={
					<>
						Understand the data.
						<br />
						Work through an example.
					</>
				}
				description="Free explanations, from choosing a strike and sizing a trade to gamma exposure, open interest and volatility. Read the reasoning, work through a hypothetical case and check your understanding."
			>
				<p className="text-muted-foreground text-sm">
					No sign-in required · Guides currently available in English
				</p>
			</PageIntro>
			<GuideCards headingLevel={2} />
		</main>
	);
}
