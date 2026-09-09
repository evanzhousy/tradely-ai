import { Link } from "@tanstack/react-router";
import { BentoCard, BentoGrid } from "@tradely/ui/components/bento-grid";
import { ArrowUpRightIcon, Clock3Icon } from "lucide-react";
import { type Guide, guides } from "@/content/guides";
import { LessonInfographic } from "./lesson-infographic";

const subjects = {
	"gamma-exposure": "gamma-exposure",
	"open-interest-vs-volume": "session-flow-vs-structure",
	"iv-crush": "implied-realized-volatility",
} as const;

export function GuideCards({
	items = guides,
	headingLevel = 3,
}: {
	items?: Guide[];
	headingLevel?: 2 | 3;
}) {
	const Heading = headingLevel === 2 ? "h2" : "h3";
	return (
		<BentoGrid lang="en">
			{items.map((guide) => (
				<BentoCard
					key={guide.slug}
					visual={
						<div className="guide-visual">
							<LessonInfographic
								subject={subjects[guide.slug]}
								locale="en"
								motionEnabled={false}
							/>
						</div>
					}
					eyebrow={
						<>
							Free guide <span aria-hidden="true">·</span>
							<Clock3Icon size={12} aria-hidden="true" />
							{guide.minutes} min
						</>
					}
					title={
						<Heading>
							<Link
								className="underline-offset-4 hover:underline"
								to="/guides/$guideSlug"
								params={{ guideSlug: guide.slug }}
							>
								{guide.title}
							</Link>
						</Heading>
					}
					description={guide.description}
					footer={
						<Link
							to="/guides/$guideSlug"
							params={{ guideSlug: guide.slug }}
							className="guide-link"
						>
							Read the guide
							<ArrowUpRightIcon size={16} aria-hidden="true" />
							<span className="sr-only">: {guide.title}</span>
						</Link>
					}
				/>
			))}
		</BentoGrid>
	);
}
