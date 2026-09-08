import { useLocation } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
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
		<a
			href={
				disabled
					? undefined
					: `/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`
			}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : undefined}
			className={cn(
				buttonVariants({ size }),
				disabled && "pointer-events-none opacity-50",
			)}
			onClick={() => {
				if (!disabled) onClick?.();
			}}
		>
			{children}
		</a>
	);
}
