import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { ListIcon } from "lucide-react";
import { useActiveSection } from "@/hooks/use-active-section";

export type ContentsItem = { id: string; title: string };

/** 21st's documentation-layout pattern: real anchors, progressive scroll-spy enhancement. */
export function TableOfContents({
	items,
	label,
}: {
	items: ContentsItem[];
	label: string;
}) {
	const activeId = useActiveSection(items.map((item) => item.id));
	return (
		<nav aria-label={label} className="table-of-contents">
			<DisclosurePanel
				defaultExpanded
				summary={
					<>
						<ListIcon size={15} aria-hidden="true" />
						{label}
					</>
				}
			>
				<ol>
					{items.map((item) => (
						<li key={item.id}>
							<HeroLink
								href={`#${item.id}`}
								aria-current={activeId === item.id ? "location" : undefined}
							>
								{item.title}
							</HeroLink>
						</li>
					))}
				</ol>
			</DisclosurePanel>
		</nav>
	);
}
