import { z } from "zod";
import { type GuestWork, guestWorkSchema } from "@/domain/guest-learning";

export const GUEST_HANDOFF_TTL = 24 * 60 * 60 * 1000;
const MAX_BYTES = 2 * 1024 * 1024;
const PREFIX = "tradely:guest-save:v1:";
const PROMPT_SEEN = "tradely:guest-save-prompt:v1";
const schema = z
	.object({
		version: z.literal(1),
		transferId: z.string().uuid(),
		createdAt: z.number().finite(),
		work: guestWorkSchema,
		boundUserId: z.string().min(1).max(200).optional(),
	})
	.strict();
export type GuestHandoff = z.infer<typeof schema>;
type SessionStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type HandoffRead =
	| { status: "ready"; handoff: GuestHandoff }
	| { status: "missing" | "expired" | "invalid" | "unavailable" };

/** Browser-only, explicit save intent. No anonymous server record or analytics payload. */
export function readGuestHandoff(
	lessonId: string,
	store: SessionStore,
	now = Date.now(),
): HandoffRead {
	try {
		const raw = store.getItem(PREFIX + lessonId);
		if (!raw) return { status: "missing" };
		if (
			raw.length > MAX_BYTES ||
			new TextEncoder().encode(raw).byteLength > MAX_BYTES
		)
			return { status: "invalid" };
		const parsed = schema.safeParse(JSON.parse(raw));
		if (!parsed.success || parsed.data.work.lessonId !== lessonId)
			return { status: "invalid" };
		if (
			parsed.data.createdAt > now ||
			now - parsed.data.createdAt >= GUEST_HANDOFF_TTL
		) {
			store.removeItem(PREFIX + lessonId);
			return { status: "expired" };
		}
		return { status: "ready", handoff: parsed.data };
	} catch {
		return { status: "unavailable" };
	}
}

export function writeGuestHandoff(handoff: GuestHandoff, store: SessionStore) {
	const raw = JSON.stringify(schema.parse(handoff));
	if (new TextEncoder().encode(raw).byteLength > MAX_BYTES)
		throw new Error("Guest work storage unavailable");
	store.setItem(PREFIX + handoff.work.lessonId, raw);
	if (store.getItem(PREFIX + handoff.work.lessonId) !== raw)
		throw new Error("Guest work storage unavailable");
}

export function prepareGuestHandoff(
	work: GuestWork,
	store: SessionStore,
	now = Date.now(),
): GuestHandoff {
	const validated = guestWorkSchema.parse(work);
	const existing = readGuestHandoff(work.lessonId, store, now);
	const handoff: GuestHandoff =
		existing.status === "ready" &&
		JSON.stringify(existing.handoff.work) === JSON.stringify(validated)
			? existing.handoff
			: {
					version: 1,
					transferId: crypto.randomUUID(),
					createdAt: now,
					work: validated,
				};
	writeGuestHandoff(handoff, store);
	return handoff;
}

export function clearGuestHandoff(
	lessonId: string,
	transferId: string,
	store: SessionStore,
) {
	const current = readGuestHandoff(lessonId, store);
	if (current.status === "ready" && current.handoff.transferId === transferId)
		store.removeItem(PREFIX + lessonId);
}
export function guestPromptWasShown(store: SessionStore) {
	return store.getItem(PROMPT_SEEN) === "1";
}
export function markGuestPromptShown(store: SessionStore) {
	store.setItem(PROMPT_SEEN, "1");
}
