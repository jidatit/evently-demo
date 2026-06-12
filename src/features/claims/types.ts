export type ClaimType = "no_show" | "cancellation";
export type ClaimStatus = "under_review" | "approved" | "denied";

export type BookingClaim = {
  id: string;
  bookingId: string;
  submittedBy: string;
  claimType: ClaimType;
  description: string;
  status: ClaimStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  submitterName?: string;
  submitterEmail?: string;
  bookingEventDate?: string;
  bookingStatus?: string;
  serviceName?: string;
  vendorName?: string;
  vendorEmail?: string;
  plannerName?: string;
  plannerEmail?: string;
};

export function getClaimTypeLabel(type: ClaimType): string {
  switch (type) {
    case "no_show":
      return "No Show";
    case "cancellation":
      return "Cancellation Request";
    default:
      return type;
  }
}

export function getClaimStatusLabel(status: ClaimStatus): string {
  switch (status) {
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    default:
      return status;
  }
}

/** Matches DB: event_date::timestamp + interval '48 hours' */
export function isWithinClaimBuffer(eventDate: string): boolean {
  const bufferEnd = new Date(`${eventDate}T00:00:00`);
  bufferEnd.setHours(bufferEnd.getHours() + 48);
  return Date.now() < bufferEnd.getTime();
}
