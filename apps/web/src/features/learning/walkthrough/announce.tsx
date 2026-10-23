import { useEffect, useRef, useState } from "react";

/** How long an announcement stays in the region: long enough to be read out, then gone. */
const HOLD_MS = 5000;

/**
 * Reads `text` to a screen reader whenever it changes, then empties
 * itself. The visible copy beside it keeps its term buttons, and a reader moving line by line
 * meets that copy once instead of a second, hidden one. `off` stops announcing, as autoplay does.
 */
export function Announce({
	text,
	off = false,
}: {
	text: string;
	off?: boolean;
}) {
	const [message, setMessage] = useState("");
	// The text already on screen when this mounts isn't news; only a change is announced.
	const last = useRef(text);
	useEffect(() => {
		if (text === last.current) return;
		last.current = text;
		if (off || !text) {
			setMessage("");
			return;
		}
		setMessage(text);
		const timer = window.setTimeout(() => setMessage(""), HOLD_MS);
		return () => window.clearTimeout(timer);
	}, [text, off]);
	return (
		<p className="sr-only" aria-live={off ? "off" : "polite"}>
			{message}
		</p>
	);
}
