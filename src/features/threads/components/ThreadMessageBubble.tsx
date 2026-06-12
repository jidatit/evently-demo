import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/features/bookings/types";
import type { ThreadMessage } from "../types";
import {
  QuoteMessageBubble,
  type QuoteBubbleMode,
} from "./QuoteMessageBubble";

interface ThreadMessageBubbleProps {
  message: ThreadMessage;
  currentUserId: string;
  mode?: QuoteBubbleMode;
  bookingStatus?: BookingStatus | null;
  onAcceptQuote?: (messageId: string) => void;
  onDeclineQuote?: (messageId: string, reason?: string) => void;
  onWithdrawQuote?: (messageId: string, reason?: string) => void;
  isAcceptingQuote?: boolean;
  isDecliningQuote?: boolean;
  isWithdrawingQuote?: boolean;
}

export function ThreadMessageBubble({
  message,
  currentUserId,
  mode,
  bookingStatus,
  onAcceptQuote,
  onDeclineQuote,
  onWithdrawQuote,
  isAcceptingQuote,
  isDecliningQuote,
  isWithdrawingQuote,
}: ThreadMessageBubbleProps) {
  const isOwn = message.senderId === currentUserId;
  const isQuote = message.type === "quote";
  const when = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });
  const label = message.senderName || (isOwn ? "You" : "Participant");

  if (isQuote && mode) {
    return (
      <QuoteMessageBubble
        message={message}
        mode={mode}
        bookingStatus={bookingStatus}
        onAccept={
          onAcceptQuote ? () => onAcceptQuote(message.id) : undefined
        }
        onDecline={
          onDeclineQuote
            ? (reason) => onDeclineQuote(message.id, reason)
            : undefined
        }
        onWithdraw={
          onWithdrawQuote
            ? (reason) => onWithdrawQuote(message.id, reason)
            : undefined
        }
        isAccepting={isAcceptingQuote}
        isDeclining={isDecliningQuote}
        isWithdrawing={isWithdrawingQuote}
      />
    );
  }

  return (
    <div
      className={cn("flex w-full flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md",
        )}
      >
        <p className="mb-0.5 text-xs font-medium opacity-90">{label}</p>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <span className="px-1 text-xs text-muted-foreground">{when}</span>
    </div>
  );
}
