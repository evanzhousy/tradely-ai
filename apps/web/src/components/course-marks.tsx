import { cn } from "@tradely/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
	CompassIcon,
	LayersIcon,
	ListChecksIcon,
	NotebookPenIcon,
	ScanSearchIcon,
	SearchIcon,
} from "lucide-react";

const STAGE_ICONS: Record<string, LucideIcon> = {
	Method: CompassIcon,
	Discovery: ScanSearchIcon,
	Inspection: SearchIcon,
	Validation: ListChecksIcon,
	Structure: LayersIcon,
	"Research output": NotebookPenIcon,
};

export function StageIcon({
	category,
	className,
}: {
	category: string;
	className?: string;
}) {
	const Icon = STAGE_ICONS[category] ?? CompassIcon;
	return <Icon className={cn("size-3.5", className)} aria-hidden />;
}
