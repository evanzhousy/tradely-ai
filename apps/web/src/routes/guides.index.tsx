import { createFileRoute } from "@tanstack/react-router";
import { GuideCards } from "@/components/guide-cards";
import { PageIntro } from "@/components/page-intro";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/guides/")({
	head: () => pageHead("/guides"),
	component: GuidesPage,
});

function GuidesPage() {
	return (
		<main lang="en" className="page-shell">
			<PageIntro
				eyebrow="The options field guide"
				title={
					<>
						Understand the data.
						<br />
						Work through an example.
					</>
				}
				description="Free explanations of gamma exposure, open interest and volatility. Read the reasoning, explore a hypothetical case and check what the evidence can tell you."
			>
				<p className="text-muted-foreground text-sm">
					No sign-in required · Guides currently available in English
				</p>
			</PageIntro>
			<GuideCards headingLevel={2} />
		</main>
	);
}
