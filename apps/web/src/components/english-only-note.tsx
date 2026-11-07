import { useI18n } from "@/i18n/provider";

/** Tells a Chinese reader, in Chinese, that a page's content is only in English. */
export function EnglishOnlyNote() {
	const { locale } = useI18n();
	if (locale !== "zh") return null;
	return (
		<p lang="zh-Hans" className="mb-4 text-muted-foreground text-sm">
			本页内容目前只有英文版。
		</p>
	);
}
