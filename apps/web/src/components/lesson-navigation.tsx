import { Breadcrumb, BreadcrumbItem } from "@tradely/ui/components/breadcrumb";
import { BookOpenIcon, HomeIcon } from "lucide-react";

import { type Locale, translate } from "@/i18n/messages";

export function LessonNavigation({
	locale,
	siteOrigin = "",
	lessonId,
	lessonTitle,
}: {
	locale: Locale;
	siteOrigin?: string;
	lessonId?: string;
	lessonTitle?: string;
}) {
	return (
		<Breadcrumb aria-label={translate(locale, "lesson.navigation")}>
			<BreadcrumbItem href={`${siteOrigin}/`}>
				<HomeIcon size={14} aria-hidden="true" />
				{translate(locale, "nav.learn")}
			</BreadcrumbItem>
			<BreadcrumbItem
				href={`${siteOrigin}/courses/tradingflow-foundations${lessonId ? `#lesson-${encodeURIComponent(lessonId)}` : ""}`}
			>
				<BookOpenIcon size={14} aria-hidden="true" />
				{translate(locale, "course.curriculum")}
			</BreadcrumbItem>
			{lessonTitle ? <BreadcrumbItem>{lessonTitle}</BreadcrumbItem> : null}
		</Breadcrumb>
	);
}
