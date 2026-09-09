import { createFileRoute } from "@tanstack/react-router";
import { GuideCards } from "@/components/guide-cards";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/guides/")({
	head: () => pageHead("/guides"),
	component: GuidesPage,
});

function GuidesPage() {
	return (
		<main
			lang="en"
			className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-20"
		>
			<header className="flex max-w-3xl flex-col gap-5">
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					The options field guide
				</p>
				<h1 className="font-semibold text-4xl text-display sm:text-5xl">
					Understand the data.
					<br />
					Work through an example.
				</h1>
				<p className="text-lg text-muted-foreground leading-8">
					Free explanations of gamma exposure, open interest and volatility.
					Read the reasoning, explore a hypothetical case and check what the
					evidence can tell you.
				</p>
				<p className="text-muted-foreground text-sm">
					No sign-in required · Guides currently available in English
				</p>
			</header>
			<GuideCards />
		</main>
	);
}
