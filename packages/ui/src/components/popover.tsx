"use client";

import { Popover as HeroPopover } from "@heroui/react/popover";

/** A dialog popover: opens on press or Enter, closes on Escape or a press outside, returns focus. */
const Popover = HeroPopover.Root;
const PopoverTrigger = HeroPopover.Trigger;
const PopoverContent = HeroPopover.Content;
const PopoverDialog = HeroPopover.Dialog;

export { Popover, PopoverContent, PopoverDialog, PopoverTrigger };
