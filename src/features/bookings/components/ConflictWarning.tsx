import { AlertTriangle } from "lucide-react";
import { useVendorDateConflicts } from "../hooks";

interface ConflictWarningProps {
  vendorId: string;
  eventDate: string;
  excludeBookingId?: string;
}

export function ConflictWarning({
  vendorId,
  eventDate,
  excludeBookingId,
}: ConflictWarningProps) {
  const { data: conflicts = [] } = useVendorDateConflicts(
    vendorId,
    eventDate,
    excludeBookingId,
  );

  if (conflicts.length === 0) return null;

  const first = conflicts[0];
  const extra = conflicts.length > 1 ? ` (+${conflicts.length - 1} more)` : "";

  return (
    <div className="flex gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <p>
        You have another booking on this date —{" "}
        <strong>{first.serviceName}</strong> with{" "}
        <strong>{first.plannerName}</strong>
        {extra}
      </p>
    </div>
  );
}

