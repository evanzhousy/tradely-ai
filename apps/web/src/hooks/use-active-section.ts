import { useEffect, useState } from "react";

/** Tracks real anchor targets without rewriting history or moving keyboard focus. */
export function useActiveSection(ids: string[]) {
	const key = JSON.stringify(ids);
	const [activeId, setActiveId] = useState("");
	useEffect(() => {
		const targets = (JSON.parse(key) as string[]).flatMap((id) => {
			const target = document.getElementById(id);
			return target ? [target] : [];
		});
		let frame = 0;
		const update = () => {
			frame = 0;
			const visible = targets.filter(
				(target) => target.getClientRects().length,
			);
			const passed = visible.filter(
				(target) => target.getBoundingClientRect().top <= 112,
			);
			setActiveId((passed.at(-1) ?? visible[0])?.id ?? "");
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(schedule);
		observer?.observe(document.body);
		update();
		return () => {
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
			observer?.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [key]);
	return activeId;
}
