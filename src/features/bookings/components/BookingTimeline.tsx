import { formatDistanceToNow } from "date-fns";
import { useBookingStatusHistory } from "../hooks";
import { getStatusBadgeConfig, getTimelineStatusLabel, type BookingStatus } from "../types";

function actorLabel(
  actorType: string,
  view: "vendor" | "planner",
): string {
  if (actorType === "system") return "System";
  if (actorType === "admin") return "Admin";
  if (actorType === "vendor") {
    return view === "vendor" ? "You" : "Vendor";
  }
  return view === "planner" ? "You" : "Customer";
}

interface BookingTimelineProps {
  bookingId: string;
  view: "vendor" | "planner";
}

export function BookingTimeline({ bookingId, view }: BookingTimelineProps) {
  const { data: entries = [], isLoading } = useBookingStatusHistory(bookingId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading timeline…</p>;
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>;
  }

  return (
    <ol className="space-y-4 border-l-2 border-border pl-4">
      {entries.map((entry) => {
        const badge = getStatusBadgeConfig(entry.toStatus as BookingStatus);
        const timelineLabel = getTimelineStatusLabel(entry.toStatus);
        return (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {timelineLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                {actorLabel(entry.actorType, view)}
                {" · "}
                {formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {entry.reason && (
              <p className="mt-1 text-sm text-muted-foreground">{entry.reason}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

