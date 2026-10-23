import {
	Popover,
	PopoverContent,
	PopoverDialog,
	PopoverTrigger,
} from "@tradely/ui/components/popover";
import { type ReactNode, useMemo } from "react";
import { type GlossaryEntry, glossary } from "@/content/glossary";
import type { Locale } from "@/i18n/messages";

const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One pattern per language, longest form first, never inside a longer word or number. */
function matcherFor(locale: Locale) {
	const forms = glossary
		.flatMap((entry) => entry[locale].map((form) => ({ form, entry })))
		.sort((a, b) => b.form.length - a.form.length);
	const key = (form: string) => (locale === "en" ? form.toLowerCase() : form);
	return {
		regex: new RegExp(
			`(?<![A-Za-z0-9])(?:${forms.map(({ form }) => escapeRegExp(form)).join("|")})(?![A-Za-z0-9])`,
			locale === "en" ? "gi" : "g",
		),
		lookup: (form: string) =>
			forms.find((item) => key(item.form) === key(form))?.entry,
	};
}
const matchers = { en: matcherFor("en"), zh: matcherFor("zh") };

/**
 * Text with on-demand meanings: the first use of each glossary term in the block becomes a
 * dashed-underline button that opens a short definition. Use it for teaching and feedback
 * text only, never where a learner is answering, and never inside another button, a label or
 * an `aria-live` region (announce a plain copy instead).
 */
export function TermText({ text, locale }: { text: string; locale: Locale }) {
	const nodes = useMemo(() => {
		const { regex, lookup } = matchers[locale];
		const seen = new Set<string>();
		const out: ReactNode[] = [];
		let last = 0;
		for (const match of text.matchAll(regex)) {
			const entry = lookup(match[0]);
			if (!entry || seen.has(entry.id) || match.index === undefined) continue;
			seen.add(entry.id);
			if (match.index > last) out.push(text.slice(last, match.index));
			out.push(
				<Term key={`${entry.id}:${match.index}`} entry={entry} locale={locale}>
					{match[0]}
				</Term>,
			);
			last = match.index + match[0].length;
		}
		if (last < text.length) out.push(text.slice(last));
		return out;
	}, [text, locale]);
	return <>{nodes}</>;
}

function Term({
	entry,
	locale,
	children,
}: {
	entry: GlossaryEntry;
	locale: Locale;
	children: ReactNode;
}) {
	const name = entry.name[locale];
	return (
		<Popover>
			<PopoverTrigger
				data-term={entry.id}
				render={(props) => (
					<button
						{...(props as React.ComponentProps<"button">)}
						type="button"
						className="m-0 inline min-h-0! cursor-help rounded-sm border-0 bg-transparent p-0 align-baseline underline decoration-current/50 decoration-dashed underline-offset-[3px] [color:inherit] [font:inherit] [letter-spacing:inherit] hover:decoration-current focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
					/>
				)}
			>
				{children}
			</PopoverTrigger>
			<PopoverContent
				placement="top"
				className="max-w-[min(18rem,calc(100vw-2rem))]"
			>
				<PopoverDialog aria-label={name} className="flex flex-col gap-1 p-3">
					<p className="font-medium text-sm">{name}</p>
					<p className="text-muted-foreground text-sm leading-relaxed">
						{entry.meaning[locale]}
					</p>
				</PopoverDialog>
			</PopoverContent>
		</Popover>
	);
}
