import { randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { z } from "zod";
import { subscriptionRetirementDecision } from "../src/domain/billing-retirement";

const actionSchema = z
	.object({
		kind: z.enum([
			"expire_session",
			"cancel_subscription",
			"archive_price",
			"disable_payment_link",
		]),
		id: z.string().min(1),
	})
	.strict();
const manifestSchema = z
	.object({
		version: z.literal(1),
		accountId: z.string().startsWith("acct_"),
		mode: z.enum(["test", "production"]),
		priceIds: z.array(z.string().startsWith("price_")).min(1),
		createdAt: z.string(),
		actions: z.array(actionSchema),
		review: z.array(
			z.object({ kind: z.string(), id: z.string(), reason: z.string() }),
		),
	})
	.strict();
type Action = z.infer<typeof actionSchema>;
type Review = z.infer<typeof manifestSchema>["review"];
const args = process.argv.slice(2);
if (args.includes("--help")) {
	console.log(
		"Dry run: retire-tradely-billing.ts --account-id acct_... --mode test|production --price-id price_... [--price-id price_...] --output-dir /external/path\nExecute only reviewed actions: same arguments plus --apply /external/reviewed-manifest.json. Requires injected STRIPE_API_KEY. Does not refund, settle invoices, change schedules, or send messages.",
	);
	process.exit(0);
}
const values = new Map<string, string[]>();
for (let i = 0; i < args.length; i += 2) {
	const key = args[i];
	const value = args[i + 1];
	if (
		![
			"--account-id",
			"--mode",
			"--price-id",
			"--output-dir",
			"--apply",
		].includes(key) ||
		!value ||
		value.startsWith("--")
	)
		throw new Error("Invalid argument; use --help");
	if (key !== "--price-id" && values.has(key))
		throw new Error("Duplicate argument");
	values.set(key, [...(values.get(key) ?? []), value]);
}
const accountId = z
	.string()
	.startsWith("acct_")
	.parse(values.get("--account-id")?.[0]);
const mode = z.enum(["test", "production"]).parse(values.get("--mode")?.[0]);
const priceIds = z
	.array(z.string().startsWith("price_"))
	.min(1)
	.parse(values.get("--price-id"));
if (new Set(priceIds).size !== priceIds.length)
	throw new Error("Duplicate Price IDs");
const output = resolve(
	z.string().min(1).parse(values.get("--output-dir")?.[0]),
);
await mkdir(output, { recursive: true });
const repo = await realpath(
	fileURLToPath(new URL("../../../", import.meta.url)),
);
const delta = relative(repo, await realpath(output));
if (!delta.startsWith(`..${sep}`) && !isAbsolute(delta))
	throw new Error("Output must be outside the repository");
const key = process.env.STRIPE_API_KEY;
if (
	!key ||
	!(mode === "production"
		? key.startsWith("rk_live_")
		: /^(rk|sk)_test_/.test(key))
)
	throw new Error("Inject a matching restricted production or test key");
const stripe = new Stripe(key, {
	apiVersion: "2026-07-29.dahlia",
	maxNetworkRetries: 0,
});
if ((await stripe.rawRequest("GET", "/v1/account")).id !== accountId)
	throw new Error("Stripe account mismatch");
const allowed = new Set(priceIds);
const live = mode === "production";
for (const id of priceIds) {
	const p = await stripe.prices.retrieve(id, { expand: ["product"] });
	const product =
		typeof p.product === "object" && !p.product.deleted ? p.product : null;
	if (
		p.livemode !== live ||
		!product ||
		!["membership", "course_pass"].includes(
			product.metadata.tradely_offer ?? "",
		)
	)
		throw new Error("Price mode or Tradely ownership mismatch");
}
const actions: Action[] = [];
const review: Review = [];
const customers = new Set<string>();
const decision = (s: Stripe.Subscription) =>
	subscriptionRetirementDecision({
		priceIds: s.items.data.map((i) => i.price.id),
		allowedPriceIds: priceIds,
		hasMoreItems: s.items.has_more,
		hasSchedule: Boolean(s.schedule),
		hasPendingUpdate: Boolean(s.pending_update),
		metered: s.items.data.some(
			(i) => i.price.recurring?.usage_type === "metered",
		),
	});
let scannedObjects = 0;
const observe = () => {
	if (++scannedObjects > 10000)
		throw new Error(
			"Inventory limit exceeded; no mutations performed. Narrow the audit before retrying.",
		);
};
for await (const s of stripe.subscriptions.list({
	status: "all",
	limit: 100,
})) {
	const d = decision(s);
	if (
		d === "unrelated" ||
		s.status === "canceled" ||
		s.status === "incomplete_expired"
	)
		continue;
	customers.add(typeof s.customer === "string" ? s.customer : s.customer.id);
	if (d === "review")
		review.push({
			kind: "subscription",
			id: s.id,
			reason: "Mixed/incomplete items, schedule, metering, or pending update",
		});
	else actions.push({ kind: "cancel_subscription", id: s.id });
}
for await (const schedule of stripe.subscriptionSchedules.list({
	limit: 100,
})) {
	observe();
	if (["canceled", "released", "completed"].includes(schedule.status)) continue;
	const ids = schedule.phases.flatMap((phase) =>
		phase.items.map((item) =>
			typeof item.price === "string" ? item.price : item.price.id,
		),
	);
	if (ids.some((id) => allowed.has(id)))
		review.push({
			kind: "schedule",
			id: schedule.id,
			reason: "Future or active schedule requires scoped review",
		});
}
for (const customer of customers) {
	for (const status of ["open", "draft"] as const)
		for await (const invoice of stripe.invoices.list({
			customer,
			status,
			limit: 100,
		}))
			review.push({
				kind: "invoice",
				id: invoice.id,
				reason: "Review unsettled customer invoice before cancellation",
			});
	for await (const item of stripe.invoiceItems.list({
		customer,
		pending: true,
		limit: 100,
	}))
		review.push({
			kind: "invoice_item",
			id: item.id,
			reason: "Pending customer item requires scoped review",
		});
}
for await (const session of stripe.checkout.sessions.list({
	status: "open",
	limit: 100,
})) {
	const ids: string[] = [];
	for await (const line of stripe.checkout.sessions.listLineItems(session.id, {
		limit: 100,
	}))
		if (line.price) ids.push(line.price.id);
	if (!ids.some((id) => allowed.has(id))) continue;
	if (session.livemode !== live || ids.some((id) => !allowed.has(id)))
		review.push({
			kind: "session",
			id: session.id,
			reason: "Mixed or mismatched open Session",
		});
	else actions.push({ kind: "expire_session", id: session.id });
}
for await (const link of stripe.paymentLinks.list({
	active: true,
	limit: 100,
})) {
	const ids: string[] = [];
	for await (const line of stripe.paymentLinks.listLineItems(link.id, {
		limit: 100,
	}))
		if (line.price) ids.push(line.price.id);
	if (!ids.some((id) => allowed.has(id))) continue;
	if (link.livemode !== live || ids.some((id) => !allowed.has(id)))
		review.push({
			kind: "payment_link",
			id: link.id,
			reason: "Mixed or mismatched Payment Link",
		});
	else actions.push({ kind: "disable_payment_link", id: link.id });
}
for (const id of priceIds)
	if ((await stripe.prices.retrieve(id)).active)
		actions.push({ kind: "archive_price", id });
const fresh = manifestSchema.parse({
	version: 1,
	accountId,
	mode,
	priceIds,
	createdAt: new Date().toISOString(),
	actions,
	review,
});
const runId = randomUUID();
await writeFile(
	join(output, `${runId}-inventory.json`),
	JSON.stringify(fresh, null, 2),
	{ flag: "wx", mode: 0o600 },
);
const approvedPath = values.get("--apply")?.[0];
if (!approvedPath) {
	console.log(
		JSON.stringify({
			dryRun: true,
			actions: actions.length,
			review: review.length,
			output,
		}),
	);
	process.exit(0);
}
const approved = manifestSchema.parse(
	JSON.parse(await readFile(approvedPath, "utf8")),
);
if (
	approved.accountId !== accountId ||
	approved.mode !== mode ||
	[...approved.priceIds].sort().join() !== [...priceIds].sort().join() ||
	approved.review.length ||
	review.length
)
	throw new Error(
		"Review blockers or manifest scope mismatch; no mutations performed",
	);
const approvedActions = new Set(
	approved.actions.map((a) => `${a.kind}:${a.id}`),
);
if (
	approvedActions.size !== approved.actions.length ||
	actions.some((a) => !approvedActions.has(`${a.kind}:${a.id}`))
)
	throw new Error("New unreviewed actions found; no mutations performed");
// Execute the fresh subset, so reruns do not repeat already completed actions.
const order: Action["kind"][] = [
	"disable_payment_link",
	"archive_price",
	"expire_session",
	"cancel_subscription",
];
for (const action of [...actions].sort(
	(a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
)) {
	const audit = join(output, `${runId}-${action.kind}-${action.id}.json`);
	await writeFile(audit, JSON.stringify({ action, status: "started" }), {
		flag: "wx",
		mode: 0o600,
	});
	try {
		if (action.kind === "archive_price") {
			const p = await stripe.prices.retrieve(action.id);
			if (!allowed.has(p.id) || p.livemode !== live)
				throw new Error("Price changed");
			if (p.active) await stripe.prices.update(p.id, { active: false });
		} else if (action.kind === "expire_session") {
			const s = await stripe.checkout.sessions.retrieve(action.id);
			const ids: string[] = [];
			for await (const line of stripe.checkout.sessions.listLineItems(s.id, {
				limit: 100,
			}))
				if (line.price) ids.push(line.price.id);
			if (
				s.livemode !== live ||
				!ids.length ||
				ids.some((id) => !allowed.has(id))
			)
				throw new Error("Session scope changed");
			if (s.status === "open") await stripe.checkout.sessions.expire(s.id);
			else if (s.status !== "expired")
				throw new Error("Session completed during cutover; reconcile payment");
		} else if (action.kind === "disable_payment_link") {
			const link = await stripe.paymentLinks.retrieve(action.id);
			const ids: string[] = [];
			for await (const line of stripe.paymentLinks.listLineItems(link.id, {
				limit: 100,
			}))
				if (line.price) ids.push(line.price.id);
			if (
				link.livemode !== live ||
				!ids.length ||
				ids.some((id) => !allowed.has(id))
			)
				throw new Error("Payment Link scope changed");
			if (link.active)
				await stripe.paymentLinks.update(link.id, { active: false });
		} else {
			const s = await stripe.subscriptions.retrieve(action.id);
			if (decision(s) !== "cancel" || s.livemode !== live)
				throw new Error("Subscription scope changed");
			const customer =
				typeof s.customer === "string" ? s.customer : s.customer.id;
			for (const status of ["open", "draft"] as const) {
				const invoices = await stripe.invoices.list({
					customer,
					status,
					limit: 1,
				});
				if (invoices.data.length)
					throw new Error("Invoice state changed; review before cancellation");
			}
			if (
				(await stripe.invoiceItems.list({ customer, pending: true, limit: 1 }))
					.data.length
			)
				throw new Error("Pending items changed");
			if (s.status !== "canceled" && s.status !== "incomplete_expired")
				await stripe.subscriptions.cancel(s.id, {
					invoice_now: false,
					prorate: false,
				});
		}
		await writeFile(audit, JSON.stringify({ action, status: "completed" }), {
			mode: 0o600,
		});
	} catch {
		await writeFile(
			audit,
			JSON.stringify({ action, status: "requires_reconciliation" }),
			{ mode: 0o600 },
		);
		throw new Error(
			"Retirement stopped; reconcile the external audit before retrying",
		);
	}
}
console.log(
	JSON.stringify({
		applied: actions.length,
		output,
		reconciliationRequired: true,
	}),
);
