import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { locales } from "@/i18n/locale";

export const getRequestLocale = createServerFn({ method: "GET" }).handler(
	async () => {
		const { readLocale } = await import("./locale.server");
		return readLocale();
	},
);

export const setRequestLocale = createServerFn({ method: "POST" })
	.validator(z.enum(locales))
	.handler(async ({ data }) => {
		const { writeLocale } = await import("./locale.server");
		writeLocale(data);
		return data;
	});
