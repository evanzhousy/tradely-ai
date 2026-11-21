import { cn } from "@tradely/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar";

import type { TraderProfile } from "./model";

/**
 * A self-hosted 96px profile image over the name's first letter, which shows while the image loads,
 * if it fails, or when none is on file. The image sits on top, so it also shows without JavaScript.
 */
export function TraderAvatar({
	profile,
	size,
	className,
}: {
	profile: Pick<TraderProfile, "name" | "handle" | "avatar">;
	size: number;
	className?: string;
}) {
	const initial = (
		profile.name.match(/[\p{L}\p{N}]/u)?.[0] ??
		profile.handle[0] ??
		"?"
	).toUpperCase();
	return (
		<Avatar
			style={{ width: size, height: size }}
			className={cn(
				"relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted",
				className,
			)}
		>
			{profile.avatar ? (
				<AvatarImage
					src={profile.avatar}
					alt=""
					width={size}
					height={size}
					loading="lazy"
					decoding="async"
					className="absolute inset-0 z-10 size-full object-cover"
				/>
			) : null}
			<AvatarFallback
				aria-hidden="true"
				style={{ fontSize: Math.round(size * 0.42) }}
				className="flex size-full items-center justify-center font-semibold text-muted-foreground"
			>
				{initial}
			</AvatarFallback>
		</Avatar>
	);
}
