import { Skeleton } from "@tradely/ui/components/skeleton";

export default function Loader() {
	return (
		<div className="page-shell" role="status" aria-live="polite">
			<div aria-hidden="true" className="flex flex-col gap-6 py-8">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-12 w-3/4 max-w-xl" />
				<Skeleton className="h-5 w-full max-w-2xl" />
				<div className="grid gap-5 md:grid-cols-3">
					<Skeleton className="h-52" />
					<Skeleton className="h-52" />
					<Skeleton className="h-52" />
				</div>
			</div>
			<span className="sr-only">Loading</span>
		</div>
	);
}
