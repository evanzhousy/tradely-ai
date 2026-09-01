import "@tanstack/react-start/server-only";

import type { Lesson } from "@/content/course";
import { resolveLessonAccess } from "@/domain/access";
import { captureServerException } from "./analytics/posthog.server";
import { getCurrentClerkUserId } from "./auth.server";
import { getStripeBillingState } from "./billing.server";
import {
	findAppUser,
	hasActiveCoursePass,
	hasManualAllAccess,
} from "./users.server";

export async function getCurrentCourseAccess() {
	const userId = await getCurrentClerkUserId();
	if (!userId) {
		return {
			userId: null,
			isSignedIn: false as const,
			billingState: "inactive" as const,
			hasCoursePass: false,
			hasStripeCustomer: false,
			hasManualGrant: false,
			canAccessPaid: false,
		};
	}
	try {
		const user = await findAppUser(userId);
		const hasCoursePass = hasActiveCoursePass(user);
		const hasManualGrant = hasManualAllAccess(user);
		const billingState =
			hasCoursePass || hasManualGrant
				? ("inactive" as const)
				: await getStripeBillingState(user?.stripeCustomerId ?? null);
		return {
			userId,
			isSignedIn: true as const,
			billingState,
			hasCoursePass,
			hasStripeCustomer: Boolean(user?.stripeCustomerId),
			hasManualGrant,
			canAccessPaid:
				hasCoursePass || hasManualGrant || billingState === "active",
		};
	} catch (error) {
		await captureServerException(error, {
			source: "access",
			operation: "course_access",
			userId,
		});
		return {
			userId,
			isSignedIn: true as const,
			billingState: "unavailable" as const,
			hasCoursePass: false,
			hasStripeCustomer: false,
			hasManualGrant: false,
			canAccessPaid: false,
		};
	}
}

export async function resolveCurrentLessonAccess(lesson: Lesson) {
	const courseAccess = await getCurrentCourseAccess();
	return {
		courseAccess,
		access: resolveLessonAccess({
			access: lesson.access,
			isSignedIn: courseAccess.isSignedIn,
			billingState: courseAccess.billingState,
			hasCoursePass: courseAccess.hasCoursePass,
			hasManualGrant: courseAccess.hasManualGrant,
		}),
	};
}
