import { SignInButton, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";

import { clerkIsConfigured } from "./app-providers";

function ConfiguredAuthControls() {
	const { isLoaded, isSignedIn } = useAuth();
	if (!isLoaded)
		return <span className="h-9 w-20 animate-pulse rounded-4xl bg-muted" />;
	if (isSignedIn) return <UserButton />;
	return (
		<SignInButton mode="modal">
			<Button size="sm">Sign in</Button>
		</SignInButton>
	);
}

export function AuthControls() {
	if (!clerkIsConfigured)
		return <Badge variant="secondary">Local preview</Badge>;
	return <ConfiguredAuthControls />;
}
