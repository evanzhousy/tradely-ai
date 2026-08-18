import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
	const requestMiddleware = [
		createCsrfMiddleware({
			filter: (context) => context.handlerType === "serverFn",
		}),
	];
	if (process.env.CLERK_SECRET_KEY) {
		requestMiddleware.push(clerkMiddleware());
	}
	return {
		requestMiddleware,
	};
});
