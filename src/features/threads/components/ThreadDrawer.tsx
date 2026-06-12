import React, { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useConsolidatedAuth } from "@/components/ConsolidatedAuthProvider";
import {
  useSendMessage,
  useThread,
  useThreadMessages,
} from "../hooks";
import { ThreadMessageBubble } from "./ThreadMessageBubble";
import { MessagesVendorMiniHeader } from "./MessagesVendorMiniHeader";
import type { QuoteBubbleMode } from "./QuoteMessageBubble";
import type { VendorSummary } from "../types";
import type { BookingStatus } from "@/features/bookings/types";

export interface ThreadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Public profile: create/open thread. Dashboard: pass existing thread id. */
  threadId?: string | null;
  vendorId?: string;
  /** Default label in header (e.g. vendor name on public page). */
  vendorBusinessName: string;
  /** Optional header label (e.g. customer name when vendor opens thread). */
  conversationTitle?: string;
  /** Vendor context: logo, location, link to public profile (show in drawer for planners). */
  vendorSummary?: VendorSummary | null;
  /** After send, invalidate vendor thread list */
  listVendorId?: string;
  /** After send, invalidate customer thread list */
  listCustomerId?: string;
  /** Quote actions in thread */
  quoteMode?: QuoteBubbleMode;
  bookingId?: string | null;
  bookingStatus?: BookingStatus | null;
  onAcceptQuote?: (messageId: string) => void;
  onDeclineQuote?: (messageId: string, reason?: string) => void;
  onWithdrawQuote?: (messageId: string, reason?: string) => void;
  isAcceptingQuote?: boolean;
  isDecliningQuote?: boolean;
  isWithdrawingQuote?: boolean;
}

export function ThreadDrawer({
  open,
  onOpenChange,
  threadId: threadIdProp,
  vendorId,
  vendorBusinessName,
  conversationTitle,
  vendorSummary,
  listVendorId,
  listCustomerId,
  quoteMode,
  bookingStatus,
  onAcceptQuote,
  onDeclineQuote,
  onWithdrawQuote,
  isAcceptingQuote,
  isDecliningQuote,
  isWithdrawingQuote,
}: ThreadDrawerProps) {
  const { user } = useConsolidatedAuth();
  const uid = user?.id ?? "";
  const fromPublic = !threadIdProp && !!vendorId;

  const { data: threadFromUpsert, isLoading: threadLoading } = useThread(
    vendorId,
    open && fromPublic,
  );

  const resolvedThreadId = threadIdProp ?? threadFromUpsert?.id;

  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch,
    isFetching,
  } = useThreadMessages(resolvedThreadId);

  const sendMutation = useSendMessage(resolvedThreadId, {
    vendorId: listVendorId,
    customerId: listCustomerId,
  });

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft("");
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open, resolvedThreadId]);

  const bootstrappingPublic =
    fromPublic && open && (threadLoading || !resolvedThreadId);
  const loadingMessages = !!resolvedThreadId && messagesLoading;
  const loading = bootstrappingPublic || loadingMessages;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !resolvedThreadId) return;
    await sendMutation.mutateAsync(text);
    setDraft("");
    await refetch();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="space-y-0 border-b px-4 py-3 pr-12">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-left text-lg">
              Messages · {conversationTitle ?? vendorBusinessName}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => refetch()}
              disabled={isFetching || !resolvedThreadId}
              aria-label="Refresh messages"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </SheetHeader>

        {vendorSummary ? (
          <MessagesVendorMiniHeader
            vendor={vendorSummary}
            variant="embedded"
            eyebrow="Vendor"
          />
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading…</span>
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1 px-4 py-4">
              <div className="flex flex-col gap-4 pb-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Start the conversation — ask{' '}
                    {conversationTitle ?? vendorBusinessName} anything about their
                    services.
                  </p>
                ) : (
                  messages.map((m) => (
                    <ThreadMessageBubble
                      key={m.id}
                      message={m}
                      currentUserId={uid}
                      mode={quoteMode}
                      bookingStatus={bookingStatus}
                      onAcceptQuote={onAcceptQuote}
                      onDeclineQuote={onDeclineQuote}
                      onWithdrawQuote={onWithdrawQuote}
                      isAcceptingQuote={isAcceptingQuote}
                      isDecliningQuote={isDecliningQuote}
                      isWithdrawingQuote={isWithdrawingQuote}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          )}

          <div className="border-t bg-background p-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="min-h-[72px] resize-none"
                disabled={!resolvedThreadId || sendMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 self-end"
                disabled={
                  !draft.trim() ||
                  !resolvedThreadId ||
                  sendMutation.isPending
                }
                onClick={() => void handleSend()}
                aria-label="Send"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
