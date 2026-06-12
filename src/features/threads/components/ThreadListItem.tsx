import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import type { ThreadListRow } from "../types";

interface ThreadListItemProps {
  row: ThreadListRow;
  onClick: () => void;
}

export function ThreadListItem({ row, onClick }: ThreadListItemProps) {
  const snippet =
    row.lastMessageBody.length > 120
      ? `${row.lastMessageBody.slice(0, 120)}…`
      : row.lastMessageBody;
  const when = row.lastMessageAt
    ? formatDistanceToNow(new Date(row.lastMessageAt), { addSuffix: true })
    : null;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-0 bg-white/80 p-4 shadow-md backdrop-blur-sm transition hover:bg-white"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{row.counterpartName}</h3>
          {when && (
            <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {snippet || "No messages yet"}
        </p>
      </div>
    </Card>
  );
}
