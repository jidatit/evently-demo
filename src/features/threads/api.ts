import type { ThreadMessage } from "./types";
import {
  getCustomerThreadsMock,
  getOrCreateThreadMock,
  getPendingQuoteMessageMock,
  getThreadMessagesMock,
  getVendorThreadsMock,
  sendMessageMock,
} from "@/mocks/handlers/threads";
import { mockGetSession } from "@/mocks/handlers/auth";

export const getOrCreateThread = getOrCreateThreadMock;

export const getThreadMessages = getThreadMessagesMock;

export const getPendingQuoteMessage = getPendingQuoteMessageMock;

export async function sendMessage(
  threadId: string,
  body: string,
): Promise<ThreadMessage> {
  const { session } = await mockGetSession();
  const senderId = session?.user?.id;
  if (!senderId) throw new Error("Not authenticated");
  return sendMessageMock(threadId, body, senderId);
}

export const getVendorThreads = getVendorThreadsMock;

export const getCustomerThreads = getCustomerThreadsMock;
