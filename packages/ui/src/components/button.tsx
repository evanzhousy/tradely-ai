import { Button as HeroButton } from "@heroui/react/button";
import { buttonVariants as heroButtonVariants } from "@heroui/styles";
import { cn } from "@tradely/ui/lib/utils";
import type * as React from "react";

type ButtonVariant =
	| "default"
	| "outline"
	| "secondary"
	| "ghost"
	| "destructive"
	| "link";

type ButtonSize =
	| "default"
	| "xs"
	| "sm"
	| "lg"
	| "icon"
	| "icon-xs"
	| "icon-sm"
	| "icon-lg";

type ButtonProps = Omit<
	React.ComponentProps<typeof HeroButton>,
	"className" | "isDisabled" | "isIconOnly" | "onPress" | "size" | "variant"
> & {
	className?: string;
	disabled?: boolean;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	size?: ButtonSize;
	title?: string;
	variant?: ButtonVariant;
};

function mapVariant(variant: ButtonVariant) {
	switch (variant) {
		case "default":
			return "primary" as const;
		case "destructive":
			return "danger-soft" as const;
		case "link":
			return "tertiary" as const;
		default:
			return variant;
	}
}

function mapSize(size: ButtonSize) {
	if (size === "lg" || size === "icon-lg") return "lg" as const;
	if (
		size === "xs" ||
		size === "sm" ||
		size === "icon-xs" ||
		size === "icon-sm"
	) {
		return "sm" as const;
	}
	return "md" as const;
}

function isIconSize(size: ButtonSize) {
	return size.startsWith("icon");
}

function buttonVariants({
	className,
	size = "default",
	variant = "default",
}: {
	className?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
} = {}) {
	return cn(
		heroButtonVariants({
			isIconOnly: isIconSize(size) || undefined,
			size: mapSize(size),
			variant: mapVariant(variant),
		}),
		variant === "link" && "underline-offset-4 hover:underline",
		className,
	);
}

function Button({
	className,
	disabled,
	onClick,
	variant = "default",
	size = "default",
	...props
}: ButtonProps) {
	return (
		<HeroButton
			data-slot="button"
			isDisabled={disabled}
			isIconOnly={isIconSize(size) || undefined}
			size={mapSize(size)}
			variant={mapVariant(variant)}
			className={cn(
				"group/button shrink-0 whitespace-nowrap transition-[color,box-shadow,background-color,transform] active:scale-[0.97]",
				variant === "link" && "underline-offset-4 hover:underline",
				variant === "secondary" && "text-foreground",
				className,
			)}
			onPress={
				onClick
					? (event) =>
							onClick(event as unknown as React.MouseEvent<HTMLButtonElement>)
					: undefined
			}
			{...props}
		/>
	);
}

export type { ButtonProps, ButtonSize, ButtonVariant };
export { Button, buttonVariants };
