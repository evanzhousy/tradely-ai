import { createServerFn } from "@tanstack/react-start";
import {
	coachingCommandSchema,
	coachingIdentitySchema,
} from "@/domain/coaching/types";

export const getCoaching = createServerFn({ method: "POST" })
	.validator(coachingIdentitySchema)
	.handler(async ({ data }) => {
		const { getCoachingImpl } = await import("./coaching.server");
		return getCoachingImpl(data);
	});
export const updateCoaching = createServerFn({ method: "POST" })
	.validator(coachingCommandSchema)
	.handler(async ({ data }) => {
		const { updateCoachingImpl } = await import("./coaching.server");
		return updateCoachingImpl(data);
	});
