import { Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { ArrowRightIcon } from "lucide-react";
import { type Guide, guides } from "@/content/guides";

export function GuideCards({ items = guides }: { items?: Guide[] }) {
	return (
		<div lang="en" className="grid gap-5 md:grid-cols-3">
			{items.map((guide) => (
				<Card key={guide.slug}>
					<CardHeader>
						<CardDescription>Free guide · {guide.minutes} min</CardDescription>
						<CardTitle>
							<Link
								className="underline-offset-4 hover:underline"
								to="/guides/$guideSlug"
								params={{ guideSlug: guide.slug }}
							>
								{guide.title}
							</Link>
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						<p className="text-muted-foreground leading-7">
							{guide.description}
						</p>
						<Link
							to="/guides/$guideSlug"
							params={{ guideSlug: guide.slug }}
							className="inline-flex items-center gap-2 font-medium text-sm"
						>
							Read the guide <ArrowRightIcon size={16} aria-hidden="true" />
							<span className="sr-only">: {guide.title}</span>
						</Link>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
