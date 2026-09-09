import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { type ComponentType, useState } from "react";
import type { GuideSlug } from "@/content/guides";

const loaders = {
	"gamma-exposure": () => import("./gex-demo"),
	"open-interest-vs-volume": () => import("./oi-volume-demo"),
	"iv-crush": () => import("./iv-crush-demo"),
};

export function GuideDemo({ slug }: { slug: GuideSlug }) {
	const [Demo, setDemo] = useState<ComponentType | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	const [run, setRun] = useState(0);
	async function load() {
		setPending(true);
		setError(false);
		try {
			const module = await loaders[slug]();
			setDemo(() => module.default);
		} catch {
			setError(true);
		} finally {
			setPending(false);
		}
	}
	return (
		<section id="example" className="scroll-mt-24" aria-labelledby="demo-title">
			<Card>
				<CardHeader>
					<CardTitle id="demo-title">Try the example</CardTitle>
					<CardDescription>
						Free, no sign-in required. Hypothetical data; this practice does not
						save course progress.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{Demo ? (
						<>
							<Demo key={run} />
							<Button
								variant="outline"
								className="self-start"
								onClick={() => setRun((value) => value + 1)}
							>
								Reset example
							</Button>
						</>
					) : (
						<Button
							className="self-start"
							disabled={pending}
							onClick={() => void load()}
						>
							{pending ? "Opening example…" : "Open interactive example"}
						</Button>
					)}
					{error ? (
						<Alert>
							<AlertDescription>
								The example could not load. Try again; the worked example above
								is still available.
							</AlertDescription>
						</Alert>
					) : null}
					<noscript>
						The worked example above contains the full calculation. Enable
						JavaScript to explore the controls.
					</noscript>
				</CardContent>
			</Card>
		</section>
	);
}
