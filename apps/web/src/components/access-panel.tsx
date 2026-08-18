import { SignInButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { LockKeyholeIcon, RefreshCwIcon, UserRoundIcon } from "lucide-react";

import type { LessonAccessDecision } from "@/domain/access";
import { clerkIsConfigured } from "./app-providers";

export function AccessPanel({
	access,
}: {
	access: Extract<LessonAccessDecision, { allowed: false }>;
}) {
	if (access.reason === "billing-unavailable") {
		return (
			<Alert>
				<RefreshCwIcon />
				<AlertTitle>Access could not be refreshed</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>
						Tradely could not confirm the current billing state. Retry before
						assuming this account needs to upgrade.
					</p>
					<Button onClick={() => window.location.reload()}>
						<RefreshCwIcon data-icon="inline-start" />
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (access.reason === "signed-out") {
		return (
			<Alert>
				<UserRoundIcon />
				<AlertTitle>Sign in to continue</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>
						This member lesson is tied to an individual Tradely account and
						learning record.
					</p>
					{clerkIsConfigured ? (
						<SignInButton mode="modal">
							<Button>Sign in</Button>
						</SignInButton>
					) : (
						<Button disabled>Clerk is not configured locally</Button>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert>
			<LockKeyholeIcon />
			<AlertTitle>Membership lesson</AlertTitle>
			<AlertDescription className="flex flex-col items-start gap-4">
				<p>
					Unlock the complete curriculum, persistent progress, and every future
					course update.
				</p>
				<Link to="/pricing" className={buttonVariants()}>
					View membership
				</Link>
			</AlertDescription>
		</Alert>
	);
}
