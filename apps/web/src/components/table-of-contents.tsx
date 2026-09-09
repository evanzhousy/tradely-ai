import { ListIcon } from "lucide-react";
import { useEffect, useState } from "react";

export type ContentsItem = { id: string; title: string };

/** 21st's documentation-layout pattern: real anchors, progressive scroll-spy enhancement. */
export function TableOfContents({
	items,
	label,
}: {
	items: ContentsItem[];
	label: string;
}) {
	const [activeId, setActiveId] = useState("");
	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const headings = items.flatMap(({ id }) => {
			const heading = document.getElementById(id);
			return heading ? [heading] : [];
		});
		const update = () => {
			const above = headings.filter(
				(heading) => heading.getBoundingClientRect().top <= 160,
			);
			setActiveId((above.at(-1) ?? headings[0])?.id ?? "");
		};
		const observer = new IntersectionObserver(update, {
			rootMargin: "-96px 0px -65% 0px",
			threshold: [0, 1],
		});
		headings.forEach((heading) => {
			observer.observe(heading);
		});
		update();
		return () => observer.disconnect();
	}, [items]);
	return (
		<nav aria-label={label} className="table-of-contents">
			<p>
				<ListIcon size={15} aria-hidden="true" />
				{label}
			</p>
			<ol>
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={`#${item.id}`}
							aria-current={activeId === item.id ? "location" : undefined}
							onClick={() => setActiveId(item.id)}
						>
							{item.title}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}
