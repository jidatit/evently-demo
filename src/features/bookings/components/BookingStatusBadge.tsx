import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatusBadgeConfig, type BookingStatus } from "../types";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = getStatusBadgeConfig(status);
  return (
    <Badge variant="secondary" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}

