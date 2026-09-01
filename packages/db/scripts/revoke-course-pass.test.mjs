import assert from "node:assert/strict";
import test from "node:test";

import {
	evaluateCoursePassRevocation,
	parseRevocationArgs,
	validateRevocationDatabaseSource,
} from "./revoke-course-pass.mjs";

const validArgs = [
	"--environment",
	"test",
	"--clerk-user-id",
	"user_abc123",
	"--checkout-session-id",
	"cs_test_abc123",
	"--reason",
	"refund",
	"--reference",
	"re_abc123",
];

test("parses a dry-run revocation", () => {
	assert.deepEqual(parseRevocationArgs(validArgs), {
		apply: false,
		help: false,
		environment: "test",
		clerkUserId: "user_abc123",
		checkoutSessionId: "cs_test_abc123",
		reason: "refund",
		reference: "re_abc123",
	});
});

test("accepts the pnpm argument separator", () => {
	assert.equal(parseRevocationArgs(["--", ...validArgs]).environment, "test");
});

test("requires exact confirmation for an applied revocation", () => {
	assert.throws(
		() => parseRevocationArgs([...validArgs, "--apply"]),
		/confirm-session-id/,
	);
	assert.equal(
		parseRevocationArgs([
			...validArgs,
			"--apply",
			"--confirm-session-id",
			"cs_test_abc123",
		]).apply,
		true,
	);
});

test("rejects a Session from the wrong environment", () => {
	assert.throws(
		() =>
			parseRevocationArgs([
				...validArgs.slice(0, 1),
				"production",
				...validArgs.slice(2),
			]),
		/wrong environment|does not match the production environment/,
	);
});

test("evaluates revocation state using the exact Checkout Session", () => {
	const active = {
		stripe_course_pass_checkout_session_id: "cs_test_abc123",
		course_pass_granted_at: new Date("2026-08-31T12:00:00Z"),
		course_pass_revoked_at: null,
	};
	assert.equal(evaluateCoursePassRevocation(active, "cs_test_abc123"), "ready");
	assert.equal(
		evaluateCoursePassRevocation(active, "cs_test_other"),
		"session_mismatch",
	);
	assert.equal(
		evaluateCoursePassRevocation(null, "cs_test_abc123"),
		"user_not_found",
	);
	assert.equal(
		evaluateCoursePassRevocation(
			{ ...active, course_pass_revoked_at: new Date("2026-08-31T13:00:00Z") },
			"cs_test_abc123",
		),
		"already_revoked",
	);
});

test("requires an explicitly injected production database", () => {
	assert.doesNotThrow(() =>
		validateRevocationDatabaseSource("test", "apps/web/.env"),
	);
	assert.doesNotThrow(() =>
		validateRevocationDatabaseSource("production", "injected"),
	);
	assert.throws(
		() => validateRevocationDatabaseSource("production", "apps/web/.env"),
		/requires DATABASE_URL to be injected/,
	);
});
