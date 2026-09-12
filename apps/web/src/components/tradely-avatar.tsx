import { useEffect, useRef } from "react";

/** A decorative brand companion; it never represents grading or AI activity. */
export function TradelyAvatar() {
	const host = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = host.current;
		if (!element) return;
		let cancelled = false;
		let dispose: (() => void) | undefined;
		const observer = new IntersectionObserver(async (entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			try {
				const { mountTradelyAvatar } = await import(
					"@/lib/tradely-avatar-renderer"
				);
				if (cancelled) return;
				const cleanup = await mountTradelyAvatar(element);
				if (cancelled) cleanup();
				else dispose = cleanup;
			} catch {
				// The original logo remains visible when WebGL or the model is unavailable.
			}
		});
		observer.observe(element);
		return () => {
			cancelled = true;
			observer.disconnect();
			dispose?.();
		};
	}, []);
	return (
		<div ref={host} className="tradely-avatar" aria-hidden="true">
			<img src="/brand/tradely-mark-128.png" alt="" width={128} height={128} />
		</div>
	);
}
