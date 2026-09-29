import { useLocation } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { cn } from "@tradely/ui/lib/utils";
import type { ReactNode } from "react";
import { safeReturnTo } from "@/auth/redirect";

export function SignInLink({
	children,
	onClick,
	disabled = false,
	size = "default",
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	size?: "default" | "sm";
}) {
	const location = useLocation();
	const returnTo = safeReturnTo(
		`${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`,
	);
	return (
		<HeroLink
			href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
			isDisabled={disabled}
			className={cn(
				buttonVariants({ size }),
				// Long labels, such as "Sign in to manage previous purchases", wrap on narrow
				// screens instead of running off them; one line keeps HeroUI's button height
				// at each breakpoint.
				"h-auto max-w-full whitespace-normal text-center",
				size === "sm"
					? "min-h-9 py-2 md:min-h-8 md:py-1.5"
					: "min-h-10 py-2.5 md:min-h-9 md:py-2",
				disabled && "pointer-events-none opacity-50",
			)}
			onPress={() => {
				if (!disabled) onClick?.();
			}}
		>
			{children}
		</HeroLink>
	);
}
