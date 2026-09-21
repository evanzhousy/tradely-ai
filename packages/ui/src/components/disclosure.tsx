import { Disclosure } from "@heroui/react/disclosure";
import { cn } from "@tradely/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type DisclosurePanelProps = Omit<
	ComponentProps<typeof Disclosure.Root>,
	"children"
> & {
	bodyClassName?: string;
	children: ReactNode;
	contentClassName?: string;
	indicatorClassName?: string;
	summary: ReactNode;
	triggerClassName?: string;
	triggerProps?: Omit<ComponentProps<typeof Disclosure.Trigger>, "children"> & {
		[key: `data-${string}`]: string | number | boolean | undefined;
	};
};

function DisclosurePanel({
	bodyClassName,
	children,
	className,
	contentClassName,
	indicatorClassName,
	summary,
	triggerClassName,
	triggerProps,
	...props
}: DisclosurePanelProps) {
	return (
		<Disclosure.Root className={className} {...props}>
			<Disclosure.Heading>
				<Disclosure.Trigger
					className={cn(
						"flex w-full items-center justify-between gap-3 text-left",
						triggerClassName,
					)}
					{...triggerProps}
				>
					<span className="min-w-0">{summary}</span>
					<Disclosure.Indicator
						className={cn("shrink-0", indicatorClassName)}
					/>
				</Disclosure.Trigger>
			</Disclosure.Heading>
			<Disclosure.Content className={contentClassName}>
				<Disclosure.Body className={bodyClassName}>{children}</Disclosure.Body>
			</Disclosure.Content>
		</Disclosure.Root>
	);
}

export { Disclosure, DisclosurePanel };
