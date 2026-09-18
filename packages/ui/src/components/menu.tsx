"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@tradely/ui/lib/utils";

function Menu({ ...props }: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root {...props} />;
}

function MenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
	return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

function MenuContent({
	className,
	side = "bottom",
	sideOffset = 8,
	align = "end",
	alignOffset = 0,
	...props
}: MenuPrimitive.Popup.Props &
	Pick<
		MenuPrimitive.Positioner.Props,
		"align" | "alignOffset" | "side" | "sideOffset"
	>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className="isolate z-50"
			>
				<MenuPrimitive.Popup
					data-slot="menu-content"
					className={cn(
						"min-w-56 origin-(--transform-origin) rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0",
						className,
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
	return (
		<MenuPrimitive.Item
			data-slot="menu-item"
			className={cn(
				"flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-disabled:pointer-events-none data-highlighted:bg-muted data-highlighted:text-foreground data-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Menu, MenuContent, MenuItem, MenuTrigger };
