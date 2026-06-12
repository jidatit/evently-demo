import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomerThreads,
  getOrCreateThread,
  getPendingQuoteMessage,
  getThreadMessages,
  getVendorThreads,
  sendMessage,
} from "./api";
import { useConsolidatedAuth } from "@/components/ConsolidatedAuthProvider";

export const threadKeys = {
  all: ["threads"] as const,
  vendorPair: (vendorId: string, customerId: string) =>
    [...threadKeys.all, "pair", vendorId, customerId] as const,
  messages: (threadId: string) => [...threadKeys.all, "messages", threadId] as const,
  pendingQuote: (threadId: string) =>
    [...threadKeys.all, "pendingQuote", threadId] as const,
  vendorList: (vendorId: string) => [...threadKeys.all, "vendorList", vendorId] as const,
  customerList: (customerId: string) =>
    [...threadKeys.all, "customerList", customerId] as const,
};

export function useThread(vendorId: string | undefined, open: boolean) {
  const { user, isCustomer, isVendor } = useConsolidatedAuth();
  const customerId = user?.id;
  const enabled =
    open &&
    !!vendorId &&
    !!customerId &&
    isCustomer &&
    !isVendor;

  return useQuery({
    queryKey: threadKeys.vendorPair(vendorId ?? "", customerId ?? ""),
    queryFn: () => getOrCreateThread(vendorId!, customerId!),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useThreadMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: threadKeys.messages(threadId ?? ""),
    queryFn: () => getThreadMessages(threadId!),
    enabled: !!threadId,
    refetchOnWindowFocus: true,
  });
}

export function useSendMessage(
  threadId: string | undefined,
  opts?: { vendorId?: string; customerId?: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(threadId!, body),
    onSuccess: () => {
      if (threadId) {
        queryClient.invalidateQueries({ queryKey: threadKeys.messages(threadId) });
      }
      if (opts?.vendorId) {
        queryClient.invalidateQueries({
          queryKey: threadKeys.vendorList(opts.vendorId),
        });
      }
      if (opts?.customerId) {
        queryClient.invalidateQueries({
          queryKey: threadKeys.customerList(opts.customerId),
        });
      }
      if (threadId && opts?.vendorId && opts?.customerId) {
        queryClient.invalidateQueries({
          queryKey: threadKeys.vendorPair(opts.vendorId, opts.customerId),
        });
      }
    },
    onError: (err: Error) => {
      toast.error("Could not send message", { description: err.message });
    },
  });
}

export function useVendorThreads(vendorId: string | undefined) {
  return useQuery({
    queryKey: threadKeys.vendorList(vendorId ?? ""),
    queryFn: () => getVendorThreads(vendorId!),
    enabled: !!vendorId,
  });
}

export function useCustomerThreads(customerId: string | undefined) {
  return useQuery({
    queryKey: threadKeys.customerList(customerId ?? ""),
    queryFn: () => getCustomerThreads(customerId!),
    enabled: !!customerId,
  });
}

export function usePendingQuoteMessage(
  threadId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: threadKeys.pendingQuote(threadId ?? ""),
    queryFn: () => getPendingQuoteMessage(threadId!),
    enabled: !!threadId && enabled,
    staleTime: 15 * 1000,
  });
}
