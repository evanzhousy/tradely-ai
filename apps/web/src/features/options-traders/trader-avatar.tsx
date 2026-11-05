import { cn } from "@tradely/ui/lib/utils";

import type { TraderProfile } from "./model";

/** A self-hosted 96px profile image, or the name's first letter when none is on file. */
export function TraderAvatar({
	profile,
	size,
	className,
}: {
	profile: Pick<TraderProfile, "name" | "handle" | "avatar">;
	size: number;
	className?: string;
}) {
	const style = { width: size, height: size };
	if (profile.avatar) {
		return (
			<img
				src={profile.avatar}
				alt=""
				width={size}
				height={size}
				loading="lazy"
				decoding="async"
				style={style}
				className={cn("shrink-0 rounded-full bg-muted object-cover", className)}
			/>
		);
	}
	const initial = (
		profile.name.match(/[\p{L}\p{N}]/u)?.[0] ??
		profile.handle[0] ??
		"?"
	).toUpperCase();
	return (
		<span
			aria-hidden="true"
			style={{ ...style, fontSize: Math.round(size * 0.42) }}
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
				className,
			)}
		>
			{initial}
		</span>
	);
}
