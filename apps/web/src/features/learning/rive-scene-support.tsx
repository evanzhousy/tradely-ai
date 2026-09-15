import { Component, type ReactNode, useEffect, useState } from "react";

export function useRiveMotionAllowed() {
	const [allowed, setAllowed] = useState(false);
	useEffect(() => {
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setAllowed(!preference.matches);
		update();
		preference.addEventListener("change", update);
		return () => preference.removeEventListener("change", update);
	}, []);
	return allowed;
}

export class RiveSceneBoundary extends Component<
	{
		children: ReactNode;
		fallback: ReactNode;
		onFailure: () => void;
	},
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch() {
		this.props.onFailure();
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}
