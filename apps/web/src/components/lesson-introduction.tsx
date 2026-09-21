import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { foundationIntroductions } from "@/content/foundation-introductions";
import type { Locale } from "@/i18n/messages";

export function LessonIntroduction({
	lessonId,
	locale,
}: {
	lessonId: string;
	locale: Locale;
}) {
	const intro = foundationIntroductions[lessonId];
	if (!intro) return null;
	return (
		<Card
			role="region"
			aria-label={
				locale === "zh" ? "这节课能帮你做什么" : "What this lesson helps you do"
			}
		>
			<CardHeader>
				<CardTitle>
					<h2>{intro.question[locale]}</h2>
				</CardTitle>
				<CardDescription>
					{locale === "zh" ? "学完后，你能：" : "After this lesson, you can: "}
					{intro.outcome[locale]}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p className="text-muted-foreground text-sm">{intro.before[locale]}</p>
				<p>{intro.explanation[locale]}</p>
				<div className="flex flex-col gap-2">
					<h3 className="font-medium">
						{locale === "zh" ? "一起算一个例子" : "A worked example"}
					</h3>
					<p>{intro.example[locale]}</p>
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="font-medium">
						{locale === "zh"
							? "需要时查看这些词"
							: "Terms you can look up here"}
					</h3>
					{intro.terms.map((term) => (
						<DisclosurePanel
							key={term.name.en}
							className="rounded-lg border p-3"
							summary={term.name[locale]}
							triggerClassName="font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							bodyClassName="pt-2"
						>
							<p className="mt-2 text-sm">{term.definition[locale]}</p>
						</DisclosurePanel>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
