import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  acceptBooking,
  acceptQuote,
  cancelBooking,
  createBooking,
  declineBooking,
  declineQuote,
  getBooking,
  getBookingStatusByCheckoutSession,
  getBookingStatusHistory,
  getPlannerBookings,
  getVendorBookings,
  getVendorDateConflicts,
  sendQuote,
  withdrawQuote,
} from "./api";
import type {
  CreateBookingPayload,
  QuoteActionPayload,
  SendQuotePayload,
} from "./types";
import { threadKeys } from "@/features/threads/hooks";

export const bookingKeys = {
  all: ["bookings"] as const,
  vendorList: (vendorId: string) =>
    [...bookingKeys.all, "vendorList", vendorId] as const,
  plannerList: (customerId: string) =>
    [...bookingKeys.all, "plannerList", customerId] as const,
  detail: (bookingId: string) =>
    [...bookingKeys.all, "detail", bookingId] as const,
  history: (bookingId: string) =>
    [...bookingKeys.all, "history", bookingId] as const,
  dateConflicts: (vendorId: string, date: string, excludeId?: string) =>
    [
      ...bookingKeys.all,
      "conflicts",
      vendorId,
      date,
      excludeId ?? "",
    ] as const,
  checkoutSession: (sessionId: string) =>
    [...bookingKeys.all, "checkoutSession", sessionId] as const,
};

export function useVendorBookings(vendorId?: string) {
  return useQuery({
    queryKey: bookingKeys.vendorList(vendorId ?? ""),
    queryFn: () => getVendorBookings(vendorId!),
    enabled: !!vendorId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function usePlannerBookings(customerId?: string) {
  return useQuery({
    queryKey: bookingKeys.plannerList(customerId ?? ""),
    queryFn: () => getPlannerBookings(customerId!),
    enabled: !!customerId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useBooking(bookingId?: string) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? ""),
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
    refetchOnWindowFocus: true,
  });
}

export function useCheckoutBookingStatus(sessionId?: string) {
  return useQuery({
    queryKey: bookingKeys.checkoutSession(sessionId ?? ""),
    queryFn: () => getBookingStatusByCheckoutSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

export function useBookingStatusHistory(bookingId?: string) {
  return useQuery({
    queryKey: bookingKeys.history(bookingId ?? ""),
    queryFn: () => getBookingStatusHistory(bookingId!),
    enabled: !!bookingId,
  });
}

export function useVendorDateConflicts(
  vendorId?: string,
  eventDate?: string,
  excludeBookingId?: string,
) {
  return useQuery({
    queryKey: bookingKeys.dateConflicts(
      vendorId ?? "",
      eventDate ?? "",
      excludeBookingId,
    ),
    queryFn: () =>
      getVendorDateConflicts(vendorId!, eventDate!, excludeBookingId),
    enabled: !!vendorId && !!eventDate,
  });
}

export function useCreateBooking(vendorId?: string, customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => {
      if (vendorId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.vendorList(vendorId),
        });
      }
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.plannerList(customerId),
        });
      }
      toast.success("Booking request sent", {
        description: "The vendor will review your request shortly.",
      });
    },
    onError: (err: Error) => {
      toast.error("Could not send booking request", {
        description: err.message,
      });
    },
  });
}

export function useAcceptBooking(vendorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => acceptBooking(bookingId),
    onSuccess: (result) => {
      if (vendorId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.vendorList(vendorId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(result.booking.id),
      });
      toast.success("Booking accepted", {
        description: "Payment link sent to the planner.",
      });
    },
    onError: (err: Error) => {
      toast.error("Could not accept booking", { description: err.message });
    },
  });
}

export function useDeclineBooking(vendorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      declineBooking(bookingId, reason),
    onSuccess: (booking) => {
      if (vendorId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.vendorList(vendorId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(booking.id),
      });
      toast.success("Booking declined");
    },
    onError: (err: Error) => {
      toast.error("Could not decline booking", { description: err.message });
    },
  });
}

function invalidateQuoteCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  booking: { id: string; threadId: string | null; vendorId: string; customerId: string },
  vendorId?: string,
  customerId?: string,
) {
  if (vendorId) {
    queryClient.invalidateQueries({
      queryKey: bookingKeys.vendorList(vendorId),
    });
  }
  if (customerId) {
    queryClient.invalidateQueries({
      queryKey: bookingKeys.plannerList(customerId),
    });
  }
  queryClient.invalidateQueries({
    queryKey: bookingKeys.detail(booking.id),
  });
  if (booking.threadId) {
    queryClient.invalidateQueries({
      queryKey: threadKeys.messages(booking.threadId),
    });
    queryClient.invalidateQueries({
      queryKey: threadKeys.pendingQuote(booking.threadId),
    });
  }
}

export function useSendQuote(vendorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendQuotePayload) => sendQuote(payload),
    onSuccess: (result) => {
      invalidateQuoteCaches(queryClient, result.booking, vendorId);
      toast.success("Quote sent", {
        description: "The planner can review it in your conversation.",
      });
    },
    onError: (err: Error) => {
      toast.error("Could not send quote", { description: err.message });
    },
  });
}

export function useAcceptQuote(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuoteActionPayload) => acceptQuote(payload),
    onSuccess: (result) => {
      invalidateQuoteCaches(
        queryClient,
        result.booking,
        result.booking.vendorId,
        customerId,
      );
      toast.success("Quote accepted", {
        description: "Complete payment to confirm your booking.",
      });
    },
    onError: (err: Error) => {
      toast.error("Could not accept quote", { description: err.message });
    },
  });
}

export function useDeclineQuote(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuoteActionPayload) => declineQuote(payload),
    onSuccess: (booking) => {
      invalidateQuoteCaches(
        queryClient,
        booking,
        booking.vendorId,
        customerId,
      );
      toast.success("Quote declined");
    },
    onError: (err: Error) => {
      toast.error("Could not decline quote", { description: err.message });
    },
  });
}

export function useWithdrawQuote(vendorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuoteActionPayload) => withdrawQuote(payload),
    onSuccess: (booking) => {
      invalidateQuoteCaches(queryClient, booking, vendorId);
      toast.success("Quote withdrawn");
    },
    onError: (err: Error) => {
      toast.error("Could not withdraw quote", { description: err.message });
    },
  });
}

/** Live countdown for payment link expiry; updates every minute. */
export function useExpiryCountdown(expiresAt: string | null): string {
  function formatExpiry(iso: string | null): string {
    if (!iso) return "";
    const end = new Date(iso).getTime();
    if (Number.isNaN(end)) return "";
    if (Date.now() >= end) return "Expired";
    const ms = end - Date.now();
    const totalMins = Math.floor(ms / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours >= 48) {
      const days = Math.floor(hours / 24);
      return `Expires in ${days} day${days === 1 ? "" : "s"}`;
    }
    if (hours > 0 && mins > 0) {
      return `Expires in ${hours} hour${hours === 1 ? "" : "s"} ${mins} minute${mins === 1 ? "" : "s"}`;
    }
    if (hours > 0) {
      return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
    }
    return `Expires in ${Math.max(1, totalMins)} minute${totalMins === 1 ? "" : "s"}`;
  }

  const [label, setLabel] = useState(() => formatExpiry(expiresAt));
  useEffect(() => {
    setLabel(formatExpiry(expiresAt));
    if (!expiresAt) return;
    const id = setInterval(() => setLabel(formatExpiry(expiresAt)), 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return label;
}

export function useCancelBooking(opts?: {
  vendorId?: string;
  customerId?: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      cancelBooking(bookingId, reason),
    onSuccess: (booking) => {
      if (opts?.vendorId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.vendorList(opts.vendorId),
        });
      }
      if (opts?.customerId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.plannerList(opts.customerId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(booking.id),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.history(booking.id),
      });
      if (booking.threadId) {
        queryClient.invalidateQueries({
          queryKey: threadKeys.messages(booking.threadId),
        });
        queryClient.invalidateQueries({
          queryKey: threadKeys.pendingQuote(booking.threadId),
        });
      }
      toast.success("Booking cancelled");
    },
    onError: (err: Error) => {
      toast.error("Could not cancel booking", { description: err.message });
    },
  });
}
