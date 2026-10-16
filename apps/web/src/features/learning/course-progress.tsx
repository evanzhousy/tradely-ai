import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
} from "react";
import { captureLearningReadOutcome } from "@/analytics/client";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured, useAuth } from "@/auth/client";
import { tradingFlowCourse } from "@/content/course";
import {
	learningReadFailureContext,
	readLearningData,
} from "@/lib/learning-read";
import { getCourseProgress } from "@/server/progress";

type Identity = {
	status: "loading" | "unavailable" | "ready";
	userId: string | null;
	retryIdentity?: () => Promise<void>;
};
const ProgressIdentity = createContext<Identity>({
	status: "loading",
	userId: null,
});
const progressKey = ["course-progress"] as const;
type ProgressData = Awaited<ReturnType<typeof getCourseProgress>>;
const emptyProgress: ProgressData = {
	signedIn: false,
	unavailable: true,
	completed: 0,
	percentage: 0,
	total: tradingFlowCourse.lessons.length,
	records: [],
	learning: {
		submitted: 0,
		passed: 0,
		earlier: 0,
		reviewNeeded: 0,
		lessons: {},
	},
};

function AccountProgressIdentity({ children }: { children: ReactNode }) {
	const auth = useAuth();
	const queryClient = useQueryClient();
	const userId = auth.userId;
	const status = auth.error
		? "unavailable"
		: !auth.isLoaded
			? "loading"
			: "ready";
	useEffect(() => {
		// Account changes remove and abort old private reads. Keys also isolate the
		// render before this effect runs; previous-account data is never a placeholder.
		queryClient.removeQueries({
			queryKey: progressKey,
			predicate: (query) =>
				query.queryKey[1] !== (status === "ready" ? userId : null),
		});
	}, [queryClient, status, userId]);
	return (
		<ProgressIdentity value={{ status, userId, retryIdentity: auth.refresh }}>
			{children}
		</ProgressIdentity>
	);
}

/** Identity belongs to the account provider; public route loaders never await it. */
export function CourseProgressProvider({ children }: { children: ReactNode }) {
	return authIsConfigured ? (
		<AccountProgressIdentity>{children}</AccountProgressIdentity>
	) : (
		<ProgressIdentity value={{ status: "ready", userId: null }}>
			{children}
		</ProgressIdentity>
	);
}

export function useCourseProgress() {
	const identity = useContext(ProgressIdentity);
	const { captureException } = useAnalytics();
	const query = useQuery({
		queryKey: [
			...progressKey,
			identity.status === "ready" ? identity.userId : null,
		],
		enabled: identity.status === "ready" && identity.userId !== null,
		staleTime: 30_000,
		gcTime: 60_000,
		retry: false, // The read transport owns the single retry; queries must not multiply it.
		refetchOnWindowFocus: false,
		queryFn: async ({ signal }) => {
			const expectedUserId = identity.userId;
			if (!expectedUserId) throw new Error("Progress reads require an account");
			try {
				return await readLearningData({
					operation: "course_progress_read",
					signal,
					onOutcome: captureLearningReadOutcome,
					run: (options) =>
						getCourseProgress({ ...options, data: { expectedUserId } }),
				});
			} catch (error) {
				if (!signal.aborted)
					captureException(error, {
						source: "learning_read",
						...learningReadFailureContext(error),
					});
				throw error;
			}
		},
	});
	const guest = identity.status === "ready" && identity.userId === null;
	const pending =
		identity.status === "loading" ||
		(!guest &&
			identity.status === "ready" &&
			(query.isPending || query.isFetching));
	const unavailable =
		identity.status === "unavailable" ||
		(!guest && (query.isError || query.data?.unavailable === true));
	// Failed refreshes hide stale counts, rather than presenting them as current truth.
	const data =
		!unavailable && !pending && query.data ? query.data : emptyProgress;
	return {
		...data,
		signedIn: !pending && !unavailable && data.signedIn,
		pending,
		unavailable,
		status: pending
			? ("loading" as const)
			: unavailable
				? ("unavailable" as const)
				: ("ready" as const),
		retry: () => {
			if (identity.status === "unavailable")
				void identity.retryIdentity?.().catch(() => {});
			else if (identity.status === "ready" && identity.userId)
				void query.refetch();
		},
	};
}

export function useInvalidateCourseProgress() {
	const queryClient = useQueryClient();
	return useCallback(
		() => queryClient.invalidateQueries({ queryKey: progressKey }),
		[queryClient],
	);
}
