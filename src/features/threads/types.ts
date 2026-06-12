export type ThreadStatus = "open" | "closed";

export interface Thread {
  id: string;
  vendorId: string;
  customerId: string;
  bookingId: string | null;
  status: ThreadStatus;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ThreadMessageType = "message" | "quote";
export type QuoteStatus = "pending" | "accepted" | "declined" | "withdrawn";

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderId: string;
  type: ThreadMessageType;
  body: string;
  quotePriceCents: number | null;
  quoteNotes: string | null;
  quoteStatus: QuoteStatus | null;
  createdAt: string;
  /** When joined from API */
  senderName?: string | null;
}

export interface CreateMessagePayload {
  threadId: string;
  body: string;
}

/** Shown in Messages tab header (and carried on list rows for customer threads). */
export interface VendorSummary {
  id: string;
  businessName: string;
  logoUrl: string | null;
  profileSlug: string | null;
  city: string;
  state: string;
}

/** Row for Messages tab lists (two-query merge in api). */
export interface ThreadListRow {
  thread: Thread;
  counterpartName: string;
  lastMessageBody: string;
  lastMessageAt: string | null;
  /** Present when vendor row is embedded (customer + vendor thread lists). */
  vendorSummary?: VendorSummary;
}
