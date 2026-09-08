import { buttonVariants } from "@tradely/ui/components/button";
import { BookOpenIcon, HomeIcon } from "lucide-react";

import { type Locale, translate } from "@/i18n/messages";

export function LessonNavigation({
	locale,
	siteOrigin = "",
	lessonId,
}: {
	locale: Locale;
	siteOrigin?: string;
	lessonId?: string;
}) {
	return (
		<nav
			aria-label={translate(locale, "lesson.navigation")}
			className="flex flex-wrap items-center gap-2"
		>
			<a
				href={`${siteOrigin}/`}
				className={buttonVariants({ variant: "ghost" })}
			>
				<HomeIcon data-icon="inline-start" aria-hidden="true" />
				{translate(locale, "nav.learn")}
			</a>
			<a
				href={`${siteOrigin}/courses/tradingflow-foundations${lessonId ? `#lesson-${encodeURIComponent(lessonId)}` : ""}`}
				className={buttonVariants({ variant: "outline" })}
			>
				<BookOpenIcon data-icon="inline-start" aria-hidden="true" />
				{translate(locale, "course.curriculum")}
			</a>
		</nav>
	);
}
