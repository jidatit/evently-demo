/**
 * Drains public.email_outbox — invoke on a schedule with header X-Outbox-Cron-Secret.
 * See supabase/EMAIL_OUTBOX.md for secrets and scheduling.
 */
import "./deno-globals.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { timingSafeEqual } from "../_shared/crypto.ts";
import { isStaging } from "../_shared/env.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import {
  isEnvGuardError,
  requireSupabaseServiceEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders("x-outbox-cron-secret");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPayoutsLiveHtml(dashboardUrl: string, stagingBannerHtml: string): string {
  const safeUrl = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Your payout account is connected and verified on Book'D.</p>
<ul>
  <li>Your services are now visible to planners in the marketplace.</li>
  <li>You can accept booking requests.</li>
</ul>
<p><a href="${safeUrl}">Open your vendor dashboard</a></p>
</body></html>`;
}

function buildNewThreadMessageHtml(
  recipientName: string,
  senderName: string,
  vendorBusinessName: string,
  messageSnippet: string,
  threadUrl: string,
  stagingBannerHtml: string,
): string {
  const safeUrl = escapeHtml(threadUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(recipientName)},</p>
<p><strong>${escapeHtml(senderName)}</strong> sent you a message about <strong>${escapeHtml(vendorBusinessName)}</strong>:</p>
<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px">${escapeHtml(messageSnippet)}</p>
<p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open messages</a></p>
</body></html>`;
}

function buildBookingRequestedHtml(
  plannerName: string,
  serviceName: string,
  eventDate: string,
  bookingUrl: string,
  stagingBannerHtml: string,
): string {
  const safeUrl = escapeHtml(bookingUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>You have a new booking request from <strong>${escapeHtml(plannerName)}</strong>.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View booking requests</a></p>
</body></html>`;
}

function buildBookingAcceptedHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  paymentUrl: string,
  expiresAt: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safePay = escapeHtml(paymentUrl);
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your booking with <strong>${escapeHtml(vendorBusinessName)}</strong> has been accepted.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p style="margin:16px 0;padding:12px;background:#fef3c7;border-radius:6px"><strong>Payment link expires in 48 hours</strong> (${escapeHtml(expiresAt)})</p>
<p><a href="${safePay}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Complete payment</a></p>
<p style="margin-top:24px"><a href="${safeDash}">View your bookings</a></p>
</body></html>`;
}

function buildBookingDeclinedHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  declineReason: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p><strong>${escapeHtml(vendorBusinessName)}</strong> was unable to accept your booking request.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p style="margin:16px 0;padding:12px;background:#fee2e2;border-radius:6px"><strong>Reason:</strong> ${escapeHtml(declineReason)}</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildQuoteSentHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  quoteAmount: string,
  threadUrl: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeThread = escapeHtml(threadUrl);
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p><strong>${escapeHtml(vendorBusinessName)}</strong> sent you a quote for your booking request.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Quoted price:</strong> ${escapeHtml(quoteAmount)}</li>
</ul>
<p><a href="${safeThread}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View quote &amp; respond</a></p>
<p style="margin-top:24px"><a href="${safeDash}">View your bookings</a></p>
</body></html>`;
}

function buildQuoteAcceptedHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  quoteAmount: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p><strong>${escapeHtml(plannerName)}</strong> accepted your quote.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Accepted price:</strong> ${escapeHtml(quoteAmount)}</li>
</ul>
<p>The planner has been sent a payment link to complete their booking.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View booking</a></p>
</body></html>`;
}

function buildQuoteDeclinedHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  quoteAmount: string,
  reason: string | undefined,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const reasonBlock = reason
    ? `<p style="margin:16px 0;padding:12px;background:#fee2e2;border-radius:6px"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p><strong>${escapeHtml(plannerName)}</strong> declined your quote.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Quoted price:</strong> ${escapeHtml(quoteAmount)}</li>
</ul>
${reasonBlock}
<p>You can send a revised quote from your dashboard.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View booking</a></p>
</body></html>`;
}

function buildQuoteWithdrawnHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  quoteAmount: string,
  reason: string | undefined,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const reasonBlock = reason
    ? `<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px"><strong>Note:</strong> ${escapeHtml(reason)}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p><strong>${escapeHtml(vendorBusinessName)}</strong> withdrew their quote for your booking.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Withdrawn price:</strong> ${escapeHtml(quoteAmount)}</li>
</ul>
${reasonBlock}
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildPaymentConfirmedPlannerHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  totalPaid: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p style="margin:16px 0;padding:16px;background:#dcfce7;border-radius:8px;font-size:18px;font-weight:600;color:#166534">You're booked! Payment confirmed.</p>
<p>Your payment for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> is complete.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Total paid:</strong> ${escapeHtml(totalPaid)}</li>
</ul>
<p><a href="${safeDash}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildPaymentConfirmedVendorHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  vendorPayout: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p><strong>Payment received</strong> — <strong>${escapeHtml(plannerName)}</strong> has paid for <strong>${escapeHtml(serviceName)}</strong>.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
  <li><strong>Your payout:</strong> ${escapeHtml(vendorPayout)}</li>
</ul>
<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px">Payout releases 48 hours after the event date.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function buildPaymentFailedHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  retryUrl: string,
  expiresAt: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeRetry = escapeHtml(retryUrl);
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your payment for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> was unsuccessful.</p>
<ul>
  <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p style="margin:16px 0;padding:12px;background:#fef3c7;border-radius:6px">Payment link expires ${escapeHtml(expiresAt)}</p>
<p><a href="${safeRetry}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Try payment again</a></p>
<p style="margin-top:24px"><a href="${safeDash}">View your bookings</a></p>
</body></html>`;
}

function buildBookingRefundedHtml(
  recipientName: string,
  serviceName: string,
  eventDate: string,
  refundReason: string | undefined,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const reasonBlock = refundReason
    ? `<p><strong>Reason:</strong> ${escapeHtml(refundReason)}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(recipientName)},</p>
<p>Your booking for <strong>${escapeHtml(serviceName)}</strong> on <strong>${escapeHtml(eventDate)}</strong> has been refunded.</p>
${reasonBlock}
<p>Refunds typically take 5–10 business days to appear on your statement.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function buildClaimApprovedPlannerHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your claim for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> has been <strong>approved</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>A full refund has been issued to your original payment method. Refunds typically take 5–10 business days to appear on your statement.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildClaimApprovedVendorHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p>A claim from <strong>${escapeHtml(plannerName)}</strong> for <strong>${escapeHtml(serviceName)}</strong> was reviewed and <strong>approved</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>A refund was issued to the planner. No payout will be released for this booking.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function buildClaimDeniedPlannerHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  adminNotes: string | undefined,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const notesBlock = adminNotes
    ? `<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px"><strong>Admin notes:</strong> ${escapeHtml(adminNotes)}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your claim for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> has been reviewed and <strong>denied</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
${notesBlock}
<p>Your booking remains confirmed. If you have questions, contact support.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildClaimDeniedVendorHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p>The claim from <strong>${escapeHtml(plannerName)}</strong> for <strong>${escapeHtml(serviceName)}</strong> was reviewed and <strong>denied</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>Your payout for this booking will be released on the normal schedule after the event buffer period.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function buildPaymentLinkExpiredPlannerHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your payment link for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> has <strong>expired</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>The booking is no longer held. You can contact the vendor to arrange a new payment link, or start a new booking request from the marketplace.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open your dashboard</a></p>
</body></html>`;
}

function buildPaymentLinkExpiredVendorHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p><strong>${escapeHtml(plannerName)}</strong> did not complete payment in time for <strong>${escapeHtml(serviceName)}</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>The booking has expired. Your availability for that date is now free for other planners.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open vendor dashboard</a></p>
</body></html>`;
}

function buildBookingCancelledHtml(
  recipientName: string,
  cancelledByLabel: string,
  serviceName: string,
  eventDate: string,
  reason: string | undefined,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const reasonBlock = reason
    ? `<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px"><strong>Note:</strong> ${escapeHtml(reason)}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(recipientName)},</p>
<p><strong>${escapeHtml(cancelledByLabel)}</strong> cancelled the booking for <strong>${escapeHtml(serviceName)}</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
${reasonBlock}
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function buildPayoutReleasedHtml(
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  payoutAmount: string,
  dashboardUrl: string,
  stripeDashboardUrl: string | undefined,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  const stripeBlock = stripeDashboardUrl
    ? `<p><a href="${escapeHtml(stripeDashboardUrl)}" style="color:#111">Open your Stripe dashboard</a> for payout timing to your bank.</p>`
    : "<p>Funds will appear in your bank account according to Stripe's payout schedule.</p>";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p style="margin:16px 0;padding:16px;background:#dcfce7;border-radius:8px;font-weight:600;color:#166534">Your payout of <strong>${escapeHtml(payoutAmount)}</strong> has been released for <strong>${escapeHtml(serviceName)}</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
${stripeBlock}
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open vendor dashboard</a></p>
</body></html>`;
}

function buildBookingCompletedPlannerHtml(
  plannerName: string,
  vendorBusinessName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(plannerName)},</p>
<p>Your booking for <strong>${escapeHtml(serviceName)}</strong> with <strong>${escapeHtml(vendorBusinessName)}</strong> is now marked <strong>completed</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>Thank you for using Book'D.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View your bookings</a></p>
</body></html>`;
}

function buildBookingCompletedVendorHtml(
  vendorBusinessName: string,
  plannerName: string,
  serviceName: string,
  eventDate: string,
  dashboardUrl: string,
  stagingBannerHtml: string,
): string {
  const safeDash = escapeHtml(dashboardUrl);
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${stagingBannerHtml}
<p>Hi ${escapeHtml(vendorBusinessName)},</p>
<p>The booking with <strong>${escapeHtml(plannerName)}</strong> for <strong>${escapeHtml(serviceName)}</strong> is now marked <strong>completed</strong>.</p>
<ul>
  <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
</ul>
<p>Your payout transfer is triggered automatically after completion; you will receive a separate email when funds are released to your Stripe account.</p>
<p><a href="${safeDash}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View bookings</a></p>
</body></html>`;
}

function backoffSecondsAfterFailure(attemptsAfterIncrement: number): number {
  const base = 60 * Math.pow(2, Math.min(attemptsAfterIncrement - 1, 7));
  return Math.min(base, 7200);
}

type OutboxRow = {
  id: string;
  template: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
};

async function sendPayoutsLive(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (!to || !dashboardUrl) {
    return { ok: false, message: "Invalid payload: to or dashboardUrl" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] You're live on Book'D — payouts connected`
    : "You're live on Book'D — payouts connected";

  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";

  const html = buildPayoutsLiveHtml(dashboardUrl, banner);
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

async function sendNewThreadMessage(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const recipientName = typeof row.payload.recipientName === "string"
    ? row.payload.recipientName.trim()
    : "";
  const senderName = typeof row.payload.senderName === "string"
    ? row.payload.senderName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const messageSnippet =
    typeof row.payload.messageSnippet === "string"
      ? row.payload.messageSnippet.trim()
      : "";
  const threadUrl = typeof row.payload.threadUrl === "string"
    ? row.payload.threadUrl.trim()
    : "";
  if (!to || !senderName || !vendorBusinessName || !messageSnippet || !threadUrl) {
    return {
      ok: false,
      message:
        "Invalid payload: to, senderName, vendorBusinessName, messageSnippet, threadUrl required",
    };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] New message on Book'D`
    : "New message on Book'D";

  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";

  const greet = recipientName || to.split("@")[0] || "there";
  const html = buildNewThreadMessageHtml(
    greet,
    senderName,
    vendorBusinessName,
    messageSnippet,
    threadUrl,
    banner,
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

async function sendBookingRequested(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const bookingUrl = typeof row.payload.bookingUrl === "string"
    ? row.payload.bookingUrl.trim()
    : "";
  if (!to || !plannerName || !serviceName || !eventDate || !bookingUrl) {
    return { ok: false, message: "Invalid payload for booking_requested" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] New booking request from ${plannerName}`
    : `New booking request from ${plannerName}`;
  const html = buildBookingRequestedHtml(
    plannerName,
    serviceName,
    eventDate,
    bookingUrl,
    staging
      ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
      : "",
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingAccepted(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const paymentUrl = typeof row.payload.paymentUrl === "string"
    ? row.payload.paymentUrl.trim()
    : "";
  const expiresAt = typeof row.payload.expiresAt === "string"
    ? row.payload.expiresAt.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !paymentUrl || !expiresAt || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for booking_accepted" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Your booking with ${vendorBusinessName} is confirmed — complete payment`
    : `Your booking with ${vendorBusinessName} is confirmed — complete payment`;
  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";

  const html = buildBookingAcceptedHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    paymentUrl,
    expiresAt,
    dashboardUrl,
    banner,
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingDeclined(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const declineReason = typeof row.payload.declineReason === "string"
    ? row.payload.declineReason.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !declineReason || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for booking_declined" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Booking update from ${vendorBusinessName}`
    : `Booking update from ${vendorBusinessName}`;
  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";

  const html = buildBookingDeclinedHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    declineReason,
    dashboardUrl,
    banner,
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendQuoteSent(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const quoteAmount = typeof row.payload.quoteAmount === "string"
    ? row.payload.quoteAmount.trim()
    : "";
  const threadUrl = typeof row.payload.threadUrl === "string"
    ? row.payload.threadUrl.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !quoteAmount || !threadUrl || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for quote_sent" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] ${vendorBusinessName} sent you a quote`
    : `${vendorBusinessName} sent you a quote for ${serviceName}`;
  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";

  const html = buildQuoteSentHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    quoteAmount,
    threadUrl,
    dashboardUrl,
    banner,
  );

  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendQuoteAccepted(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const quoteAmount = typeof row.payload.quoteAmount === "string"
    ? row.payload.quoteAmount.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !quoteAmount || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for quote_accepted" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] ${plannerName} accepted your quote`
    : `${plannerName} accepted your quote for ${serviceName}`;
  const html = buildQuoteAcceptedHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    quoteAmount,
    dashboardUrl,
    staging
      ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
      : "",
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendQuoteDeclined(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const quoteAmount = typeof row.payload.quoteAmount === "string"
    ? row.payload.quoteAmount.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const reason = typeof row.payload.reason === "string"
    ? row.payload.reason.trim()
    : undefined;
  if (
    !to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !quoteAmount || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for quote_declined" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Quote declined for ${serviceName}`
    : `Quote declined for ${serviceName}`;
  const banner = staging
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";
  const html = buildQuoteDeclinedHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    quoteAmount,
    reason,
    dashboardUrl,
    banner,
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendQuoteWithdrawn(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const quoteAmount = typeof row.payload.quoteAmount === "string"
    ? row.payload.quoteAmount.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const reason = typeof row.payload.reason === "string"
    ? row.payload.reason.trim()
    : undefined;
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !quoteAmount || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for quote_withdrawn" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Quote withdrawn for ${serviceName}`
    : `Quote withdrawn for ${serviceName}`;
  const html = buildQuoteWithdrawnHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    quoteAmount,
    reason,
    dashboardUrl,
    staging
      ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
      : "",
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

function stagingBannerHtml(): string {
  return isStaging()
    ? `<div style="background:#fbbf24;color:#000;padding:10px;margin-bottom:16px;border-radius:4px;"><strong>STAGING</strong></div>`
    : "";
}

async function sendPaymentConfirmedPlanner(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const totalPaid = typeof row.payload.totalPaid === "string"
    ? row.payload.totalPaid.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !totalPaid || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payment_confirmed_planner" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] You're booked! Payment confirmed for ${serviceName}`
    : `You're booked! Payment confirmed for ${serviceName}`;
  const html = buildPaymentConfirmedPlannerHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    totalPaid,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendPaymentConfirmedVendor(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const vendorPayout = typeof row.payload.vendorPayout === "string"
    ? row.payload.vendorPayout.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !vendorPayout || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payment_confirmed_vendor" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Booking confirmed — payment received for ${serviceName}`
    : `Booking confirmed — payment received for ${serviceName}`;
  const html = buildPaymentConfirmedVendorHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    vendorPayout,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendPaymentFailed(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const retryUrl = typeof row.payload.retryUrl === "string"
    ? row.payload.retryUrl.trim()
    : "";
  const expiresAt = typeof row.payload.expiresAt === "string"
    ? row.payload.expiresAt.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !retryUrl || !expiresAt || !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payment_failed" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Payment unsuccessful — please try again`
    : "Payment unsuccessful — please try again";
  const html = buildPaymentFailedHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    retryUrl,
    expiresAt,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendPaymentLinkExpiredPlanner(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payment_link_expired_planner" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Your payment link has expired — ${vendorBusinessName}`
    : `Your payment link has expired — ${vendorBusinessName}`;
  const html = buildPaymentLinkExpiredPlannerHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendPaymentLinkExpiredVendor(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payment_link_expired_vendor" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Booking expired — payment not completed`
    : "Booking expired — payment not completed";
  const html = buildPaymentLinkExpiredVendorHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingCancelled(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const recipientName = typeof row.payload.recipientName === "string"
    ? row.payload.recipientName.trim()
    : "";
  const cancelledByLabel =
    typeof row.payload.cancelledByLabel === "string"
      ? row.payload.cancelledByLabel.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const reason = typeof row.payload.reason === "string"
    ? row.payload.reason.trim()
    : undefined;
  if (
    !to || !recipientName || !cancelledByLabel || !serviceName || !eventDate ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for booking_cancelled" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Booking cancelled — ${serviceName}`
    : `Booking cancelled — ${serviceName}`;
  const html = buildBookingCancelledHtml(
    recipientName,
    cancelledByLabel,
    serviceName,
    eventDate,
    reason,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendPayoutReleased(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const payoutAmount = typeof row.payload.payoutAmount === "string"
    ? row.payload.payoutAmount.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const stripeDashboardUrl =
    typeof row.payload.stripeDashboardUrl === "string"
      ? row.payload.stripeDashboardUrl.trim()
      : undefined;
  if (
    !to || !vendorBusinessName || !serviceName || !eventDate || !payoutAmount ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for payout_released" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Your payout has been released — ${serviceName}`
    : `Your payout has been released — ${serviceName}`;
  const html = buildPayoutReleasedHtml(
    vendorBusinessName,
    serviceName,
    eventDate,
    payoutAmount,
    dashboardUrl,
    stripeDashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingCompletedPlanner(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for booking_completed_planner" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Booking completed — ${serviceName}`
    : `Booking completed — ${serviceName}`;
  const html = buildBookingCompletedPlannerHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingCompletedVendor(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName =
    typeof row.payload.vendorBusinessName === "string"
      ? row.payload.vendorBusinessName.trim()
      : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (
    !to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !dashboardUrl
  ) {
    return { ok: false, message: "Invalid payload for booking_completed_vendor" };
  }
  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }
  const subject = staging
    ? `[STAGING] Booking completed — ${serviceName}`
    : `Booking completed — ${serviceName}`;
  const html = buildBookingCompletedVendorHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendClaimApprovedPlanner(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName = typeof row.payload.vendorBusinessName === "string"
    ? row.payload.vendorBusinessName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (!to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !dashboardUrl) {
    return { ok: false, message: "Invalid payload for claim_approved_planner" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Your claim has been approved — refund issued`
    : `Your claim has been approved — refund issued`;
  const html = buildClaimApprovedPlannerHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendClaimApprovedVendor(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName = typeof row.payload.vendorBusinessName === "string"
    ? row.payload.vendorBusinessName.trim()
    : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (!to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !dashboardUrl) {
    return { ok: false, message: "Invalid payload for claim_approved_vendor" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Booking claim approved — refund issued to planner`
    : `Booking claim approved — refund issued to planner`;
  const html = buildClaimApprovedVendorHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendClaimDeniedPlanner(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const vendorBusinessName = typeof row.payload.vendorBusinessName === "string"
    ? row.payload.vendorBusinessName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const adminNotes = typeof row.payload.adminNotes === "string"
    ? row.payload.adminNotes.trim()
    : undefined;
  if (!to || !plannerName || !vendorBusinessName || !serviceName || !eventDate ||
    !dashboardUrl) {
    return { ok: false, message: "Invalid payload for claim_denied_planner" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Your claim has been reviewed`
    : `Your claim has been reviewed`;
  const html = buildClaimDeniedPlannerHtml(
    plannerName,
    vendorBusinessName,
    serviceName,
    eventDate,
    adminNotes,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendClaimDeniedVendor(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const vendorBusinessName = typeof row.payload.vendorBusinessName === "string"
    ? row.payload.vendorBusinessName.trim()
    : "";
  const plannerName = typeof row.payload.plannerName === "string"
    ? row.payload.plannerName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  if (!to || !vendorBusinessName || !plannerName || !serviceName || !eventDate ||
    !dashboardUrl) {
    return { ok: false, message: "Invalid payload for claim_denied_vendor" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Booking claim denied — payout will be released`
    : `Booking claim denied — payout will be released`;
  const html = buildClaimDeniedVendorHtml(
    vendorBusinessName,
    plannerName,
    serviceName,
    eventDate,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function sendBookingRefunded(
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = typeof row.payload.to === "string" ? row.payload.to.trim() : "";
  const recipientName = typeof row.payload.recipientName === "string"
    ? row.payload.recipientName.trim()
    : "";
  const serviceName = typeof row.payload.serviceName === "string"
    ? row.payload.serviceName.trim()
    : "";
  const eventDate = typeof row.payload.eventDate === "string"
    ? row.payload.eventDate.trim()
    : "";
  const dashboardUrl = typeof row.payload.dashboardUrl === "string"
    ? row.payload.dashboardUrl.trim()
    : "";
  const refundReason = typeof row.payload.refundReason === "string"
    ? row.payload.refundReason.trim()
    : undefined;
  if (!to || !recipientName || !serviceName || !eventDate || !dashboardUrl) {
    return { ok: false, message: "Invalid payload for booking_refunded" };
  }

  const staging = isStaging();
  const resendApiKey = staging
    ? Deno.env.get("RESEND_TEST_API_KEY")
    : Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { ok: false, message: "Resend API key not configured" };
  }

  const subject = staging
    ? `[STAGING] Booking refunded — ${serviceName}`
    : `Booking refunded — ${serviceName}`;
  const html = buildBookingRefundedHtml(
    recipientName,
    serviceName,
    eventDate,
    refundReason,
    dashboardUrl,
    stagingBannerHtml(),
  );
  const from = Deno.env.get("EMAIL_FROM") ??
    "Book'D <noreply@support.jidatit.uk>";
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  const expected = Deno.env.get("OUTBOX_CRON_SECRET") ?? "";
  if (!expected) {
    console.error("OUTBOX_CRON_SECRET not set");
    return jsonResponse({ error: "Server misconfigured" }, 500, cors);
  }

  const provided = req.headers.get("x-outbox-cron-secret") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }

  try {
    const envCheck = requireSupabaseServiceEnv(cors);
    if (isEnvGuardError(envCheck)) return envCheck.response;
    const { url: supabaseUrl, serviceRoleKey: serviceKey } = envCheck.env;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: claimed, error: claimError } = await admin.rpc(
      "claim_email_outbox_batch",
      { p_limit: 25 },
    );

    if (claimError) {
      console.error("claim_email_outbox_batch:", claimError.message);
      return jsonResponse({ error: claimError.message }, 500, cors);
    }

    const rows = (claimed ?? []) as OutboxRow[];
    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      let result;
      if (row.template === "payouts_live") {
        result = await sendPayoutsLive(row);
      } else if (row.template === "new_thread_message") {
        result = await sendNewThreadMessage(row);
      } else if (row.template === "booking_requested") {
        result = await sendBookingRequested(row);
      } else if (row.template === "booking_accepted") {
        result = await sendBookingAccepted(row);
      } else if (row.template === "booking_declined") {
        result = await sendBookingDeclined(row);
      } else if (row.template === "quote_sent") {
        result = await sendQuoteSent(row);
      } else if (row.template === "quote_accepted") {
        result = await sendQuoteAccepted(row);
      } else if (row.template === "quote_declined") {
        result = await sendQuoteDeclined(row);
      } else if (row.template === "quote_withdrawn") {
        result = await sendQuoteWithdrawn(row);
      } else if (row.template === "payment_confirmed_planner") {
        result = await sendPaymentConfirmedPlanner(row);
      } else if (row.template === "payment_confirmed_vendor") {
        result = await sendPaymentConfirmedVendor(row);
      } else if (row.template === "payment_failed") {
        result = await sendPaymentFailed(row);
      } else if (row.template === "payment_link_expired_planner") {
        result = await sendPaymentLinkExpiredPlanner(row);
      } else if (row.template === "payment_link_expired_vendor") {
        result = await sendPaymentLinkExpiredVendor(row);
      } else if (row.template === "booking_cancelled") {
        result = await sendBookingCancelled(row);
      } else if (row.template === "payout_released") {
        result = await sendPayoutReleased(row);
      } else if (row.template === "booking_completed_planner") {
        result = await sendBookingCompletedPlanner(row);
      } else if (row.template === "booking_completed_vendor") {
        result = await sendBookingCompletedVendor(row);
      } else if (row.template === "booking_refunded") {
        result = await sendBookingRefunded(row);
      } else if (row.template === "claim_approved_planner") {
        result = await sendClaimApprovedPlanner(row);
      } else if (row.template === "claim_approved_vendor") {
        result = await sendClaimApprovedVendor(row);
      } else if (row.template === "claim_denied_planner") {
        result = await sendClaimDeniedPlanner(row);
      } else if (row.template === "claim_denied_vendor") {
        result = await sendClaimDeniedVendor(row);
      } else {
        const { error: upErr } = await admin.from("email_outbox").update({
          status: "dead",
          last_error: `Unknown template: ${row.template}`,
        }).eq("id", row.id);
        if (upErr) {
          console.error("mark dead (unknown template)", row.id, upErr.message);
        }
        failed++;
        continue;
      }

      if (result.ok) {
        const { error: upErr } = await admin.from("email_outbox").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
        }).eq("id", row.id);
        if (upErr) console.error("mark sent failed", row.id, upErr.message);
        else sent++;
        continue;
      }

      const nextAttempts = row.attempts + 1;
      const message = result.message;
      if (nextAttempts >= row.max_attempts) {
        const { error: upErr } = await admin.from("email_outbox").update({
          status: "dead",
          attempts: nextAttempts,
          last_error: message,
        }).eq("id", row.id);
        if (upErr) console.error("mark dead failed", row.id, upErr.message);
        else failed++;
      } else {
        const delaySec = backoffSecondsAfterFailure(nextAttempts);
        const nextAt = new Date(Date.now() + delaySec * 1000).toISOString();
        const { error: upErr } = await admin.from("email_outbox").update({
          status: "pending",
          attempts: nextAttempts,
          last_error: message,
          next_attempt_at: nextAt,
        }).eq("id", row.id);
        if (upErr) console.error("mark retry failed", row.id, upErr.message);
        else failed++;
      }
    }

    return jsonResponse({ claimed: rows.length, sent, failed }, 200, cors);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: errorMessage(e) }, 500, cors);
  }
});
