import type { Thread, ThreadListRow, ThreadMessage } from '@/features/threads/types';
import { findProfile, findVendor, getDb, newId, updateDb } from '../db';
import { mockDelay } from '../delay';

function mapThread(row: ReturnType<typeof getDb>['threads'][0]): Thread {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    customerId: row.customer_id,
    bookingId: row.booking_id,
    status: row.status,
    lastNotifiedAt: row.last_notified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(
  row: ReturnType<typeof getDb>['thread_messages'][0],
  db: ReturnType<typeof getDb>,
): ThreadMessage {
  const sender = findProfile(db, row.sender_id);
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    type: row.type,
    body: row.body,
    quotePriceCents: row.quote_price_cents,
    quoteNotes: row.quote_notes,
    quoteStatus: row.quote_status,
    createdAt: row.created_at,
    senderName:
      sender?.name?.trim() ||
      sender?.email?.trim()?.split('@')[0] ||
      null,
  };
}

function latestMessages(db: ReturnType<typeof getDb>, threadIds: string[]) {
  const map = new Map<string, { body: string; createdAt: string }>();
  db.thread_messages
    .filter((m) => threadIds.includes(m.thread_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .forEach((m) => {
      if (!map.has(m.thread_id)) {
        map.set(m.thread_id, { body: m.body, createdAt: m.created_at });
      }
    });
  return map;
}

export async function getOrCreateThreadMock(
  vendorId: string,
  customerId: string,
): Promise<Thread> {
  await mockDelay();
  const db = getDb();
  const existing = db.threads.find(
    (t) => t.vendor_id === vendorId && t.customer_id === customerId,
  );
  if (existing) return mapThread(existing);

  const now = new Date().toISOString();
  const thread = {
    id: newId('thread'),
    vendor_id: vendorId,
    customer_id: customerId,
    booking_id: null,
    status: 'open' as const,
    last_notified_at: null,
    created_at: now,
    updated_at: now,
  };
  updateDb((d) => d.threads.push(thread));
  return mapThread(thread);
}

export async function getThreadMessagesMock(threadId: string): Promise<ThreadMessage[]> {
  await mockDelay();
  const db = getDb();
  return db.thread_messages
    .filter((m) => m.thread_id === threadId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((m) => mapMessage(m, db));
}

export async function getPendingQuoteMessageMock(
  threadId: string,
): Promise<ThreadMessage | null> {
  await mockDelay();
  const db = getDb();
  const row = db.thread_messages
    .filter(
      (m) =>
        m.thread_id === threadId && m.type === 'quote' && m.quote_status === 'pending',
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!row) return null;
  return mapMessage(row, db);
}

export async function sendMessageMock(
  threadId: string,
  body: string,
  senderId: string,
): Promise<ThreadMessage> {
  await mockDelay();
  const now = new Date().toISOString();
  const msg = {
    id: newId('msg'),
    thread_id: threadId,
    sender_id: senderId,
    type: 'message' as const,
    body,
    quote_price_cents: null,
    quote_notes: null,
    quote_status: null,
    created_at: now,
  };
  updateDb((db) => {
    db.thread_messages.push(msg);
    const thread = db.threads.find((t) => t.id === threadId);
    if (thread) thread.updated_at = now;
  });
  return mapMessage(msg, getDb());
}

export async function getVendorThreadsMock(vendorId: string): Promise<ThreadListRow[]> {
  await mockDelay();
  const db = getDb();
  const threads = db.threads.filter((t) => t.vendor_id === vendorId);
  const latest = latestMessages(
    db,
    threads.map((t) => t.id),
  );

  return threads.map((t) => {
    const customer = findProfile(db, t.customer_id);
    const last = latest.get(t.id);
    return {
      thread: mapThread(t),
      counterpartName:
        customer?.name?.trim() ||
        customer?.email?.trim()?.split('@')[0] ||
        'Customer',
      lastMessageBody: last?.body ?? '',
      lastMessageAt: last?.createdAt ?? null,
    };
  });
}

export async function getCustomerThreadsMock(customerId: string): Promise<ThreadListRow[]> {
  await mockDelay();
  const db = getDb();
  const threads = db.threads.filter((t) => t.customer_id === customerId);
  const latest = latestMessages(
    db,
    threads.map((t) => t.id),
  );

  return threads.map((t) => {
    const vendor = findVendor(db, t.vendor_id);
    const last = latest.get(t.id);
    return {
      thread: mapThread(t),
      counterpartName: vendor?.business_name?.trim() || 'Vendor',
      lastMessageBody: last?.body ?? '',
      lastMessageAt: last?.createdAt ?? null,
      vendorSummary: vendor
        ? {
            id: vendor.id,
            businessName: vendor.business_name,
            logoUrl: vendor.logo_url,
            profileSlug: vendor.profile_slug,
            city: vendor.city,
            state: vendor.state,
          }
        : undefined,
    };
  });
}
