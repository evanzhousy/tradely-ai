import { createLink } from "@tanstack/react-router";
import { Link as HeroLink } from "@tradely/ui/components/link";

/**
 * HeroUI's Link with TanStack Router's typed `to`, params, hash and active state. Use it
 * for navigation inside the app; plain HeroLink stays for #anchors and external URLs.
 * React Aria skips its own navigation when the router has already handled the click.
 */
export const AppLink = createLink(HeroLink);
