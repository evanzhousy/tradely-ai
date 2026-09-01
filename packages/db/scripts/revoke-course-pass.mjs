import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const REVOCATION_REASONS = new Set([
	"refund",
	"dispute",
	"chargeback",
	"other",
]);

const HELP = `Usage:
  pnpm billing:revoke-course-pass -- \\
    --environment <test|production> \\
    --clerk-user-id <user_...> \\
    --checkout-session-id <cs_test_...|cs_live_...> \\
    --reason <refund|dispute|chargeback|other> \\
    --reference <Stripe or support reference>

The command is dry-run only unless both of these are supplied:
  --apply
  --confirm-session-id <the exact Checkout Session ID>
`;

function nextValue(argv, index, flag) {
	const value = argv[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`${flag} requires a value`);
	}
	return value;
}

export function parseRevocationArgs(argv) {
	const input = { apply: false, help: false };
	for (let index = 0; index < argv.length; index += 1) {
		const flag = argv[index];
		switch (flag) {
			case "--":
				break;
			case "--help":
			case "-h":
				input.help = true;
				break;
			case "--apply":
				input.apply = true;
				break;
			case "--environment":
				input.environment = nextValue(argv, index, flag);
				index += 1;
				break;
			case "--clerk-user-id":
				input.clerkUserId = nextValue(argv, index, flag);
				index += 1;
				break;
			case "--checkout-session-id":
				input.checkoutSessionId = nextValue(argv, index, flag);
				index += 1;
				break;
			case "--confirm-session-id":
				input.confirmSessionId = nextValue(argv, index, flag);
				index += 1;
				break;
			case "--reason":
				input.reason = nextValue(argv, index, flag);
				index += 1;
				break;
			case "--reference":
				input.reference = nextValue(argv, index, flag);
				index += 1;
				break;
			default:
				throw new Error(`Unknown argument: ${flag}`);
		}
	}

	if (input.help) return input;
	if (!new Set(["test", "production"]).has(input.environment)) {
		throw new Error("--environment must be test or production");
	}
	if (!/^user_[A-Za-z0-9]+$/.test(input.clerkUserId ?? "")) {
		throw new Error("--clerk-user-id must be a Clerk user ID");
	}
	if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(input.checkoutSessionId ?? "")) {
		throw new Error(
			"--checkout-session-id must be a Stripe Checkout Session ID",
		);
	}
	const expectedPrefix =
		input.environment === "production" ? "cs_live_" : "cs_test_";
	if (!input.checkoutSessionId.startsWith(expectedPrefix)) {
		throw new Error(
			`Checkout Session does not match the ${input.environment} environment`,
		);
	}
	if (!REVOCATION_REASONS.has(input.reason)) {
		throw new Error(
			"--reason is required and must be refund, dispute, chargeback, or other",
		);
	}
	if (
		!input.reference ||
		input.reference.length > 200 ||
		/[\r\n]/.test(input.reference)
	) {
		throw new Error(
			"--reference is required, must be one line, and must be at most 200 characters",
		);
	}
	if (input.apply && input.confirmSessionId !== input.checkoutSessionId) {
		throw new Error(
			"--apply requires --confirm-session-id to exactly match --checkout-session-id",
		);
	}
	if (!input.apply && input.confirmSessionId) {
		throw new Error("--confirm-session-id is valid only with --apply");
	}
	return input;
}

export function evaluateCoursePassRevocation(row, checkoutSessionId) {
	if (!row) return "user_not_found";
	if (
		!row.stripe_course_pass_checkout_session_id ||
		!row.course_pass_granted_at
	) {
		return "no_course_pass";
	}
	if (row.stripe_course_pass_checkout_session_id !== checkoutSessionId) {
		return "session_mismatch";
	}
	if (row.course_pass_revoked_at) return "already_revoked";
	return "ready";
}

export function validateRevocationDatabaseSource(environment, databaseSource) {
	if (!databaseSource) throw new Error("DATABASE_URL is required");
	if (environment === "production" && databaseSource !== "injected") {
		throw new Error(
			"Production revocation requires DATABASE_URL to be injected explicitly",
		);
	}
}

function identifierEvidence(value) {
	return {
		hash: createHash("sha256").update(value).digest("hex").slice(0, 12),
		suffix: value.slice(-8),
	};
}

async function loadDatabaseUrl() {
	if (process.env.DATABASE_URL) return "injected";
	const { config } = await import("dotenv");
	const localEnv = fileURLToPath(
		new URL("../../../apps/web/.env", import.meta.url),
	);
	config({ path: localEnv, quiet: true });
	return process.env.DATABASE_URL ? "apps/web/.env" : null;
}

export async function runCoursePassRevocation(argv, output = console) {
	const input = parseRevocationArgs(argv);
	if (input.help) {
		output.log(HELP);
		return { outcome: "help" };
	}

	const databaseSource = await loadDatabaseUrl();
	validateRevocationDatabaseSource(input.environment, databaseSource);
	if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
	const { neon } = await import("@neondatabase/serverless");
	const sql = neon(process.env.DATABASE_URL);
	const rows = await sql`
		select
			clerk_user_id,
			stripe_course_pass_checkout_session_id,
			course_pass_granted_at,
			course_pass_revoked_at
		from app_user
		where clerk_user_id = ${input.clerkUserId}
		limit 1
	`;
	const outcome = evaluateCoursePassRevocation(
		rows[0] ?? null,
		input.checkoutSessionId,
	);
	const evidence = {
		operation: "course_pass.revoke",
		mode: input.apply ? "apply" : "dry-run",
		environment: input.environment,
		outcome,
		changed: false,
		databaseSource,
		user: identifierEvidence(input.clerkUserId),
		checkoutSession: identifierEvidence(input.checkoutSessionId),
		reason: input.reason,
		reference: input.reference,
	};

	if (outcome !== "ready") {
		output.log(JSON.stringify(evidence, null, 2));
		if (!new Set(["already_revoked"]).has(outcome)) process.exitCode = 2;
		return evidence;
	}
	if (!input.apply) {
		output.log(JSON.stringify(evidence, null, 2));
		return evidence;
	}

	const updated = await sql`
		update app_user
		set course_pass_revoked_at = now(), updated_at = now()
		where clerk_user_id = ${input.clerkUserId}
			and stripe_course_pass_checkout_session_id = ${input.checkoutSessionId}
			and course_pass_granted_at is not null
			and course_pass_revoked_at is null
		returning clerk_user_id
	`;
	if (updated.length !== 1) {
		throw new Error(
			"Course Pass changed after dry-run; no revocation was applied",
		);
	}
	const appliedEvidence = { ...evidence, outcome: "revoked", changed: true };
	output.log(JSON.stringify(appliedEvidence, null, 2));
	return appliedEvidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	runCoursePassRevocation(process.argv.slice(2)).catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
