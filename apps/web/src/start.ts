import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
	const requestMiddleware = [
		createCsrfMiddleware({
			filter: (context) => context.handlerType === "serverFn",
		}),
	];
	return {
		requestMiddleware,
	};
});
