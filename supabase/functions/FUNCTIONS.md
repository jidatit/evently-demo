# Edge Functions — developer reference

Five Edge Functions live in `supabase/functions/`. Shared utilities are in `_shared/`.

---

## Auth patterns

### Bearer token (user-facing functions)

Used by: `create-stripe-connect-account`, `sync-stripe-account-status`, `send-thread-message`

```
Client → Bearer <supabase JWT>
    ↓
createClient(url, SUPABASE_ANON_KEY).auth.getUser(token)   ← validates JWT
    ↓
createClient(url, SUPABASE_SERVICE_ROLE_KEY)               ← all DB reads/writes
```

The **anon** client is used **only** to verify the JWT and resolve the caller's `user.id`. Every subsequent Postgres query uses the **service role** client, scoped to the authenticated user's data via application-level filters (e.g. `.eq("user_id", user.id)`, `isCustomer` / `isVendorOwner`). RLS is bypassed; correctness relies on those explicit filters.

Required env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
Helper: `requireSupabaseUserEnv` in `_shared/supabase-env.ts`

---

### Stripe webhook signature

Used by: `stripe-webhook`

```
Stripe → POST /stripe-webhook  +  stripe-signature header
    ↓
stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET_PLATFORM)
  or, on failure, retry with STRIPE_WEBHOOK_SECRET_CONNECT
    ↓
createClient(url, SUPABASE_SERVICE_ROLE_KEY)               ← all DB writes
```

No user JWT is involved. The function trusts the Stripe signature exclusively. Two destinations point at this URL — "Your account" (platform-level events like `payment_intent.*`, `charge.refunded`) and "Connected accounts" (`account.updated`) — and Stripe issues a distinct signing secret per destination. Set both in Supabase secrets: `STRIPE_WEBHOOK_SECRET_PLATFORM` and `STRIPE_WEBHOOK_SECRET_CONNECT`. For local `stripe listen` development, set whichever one matches the CLI session secret (the other can be left unset).

Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET_PLATFORM`, `STRIPE_WEBHOOK_SECRET_CONNECT`, `STRIPE_SECRET_KEY` (or `STRIPE_TEST_SECRET_KEY` in staging)
Helper: `requireSupabaseServiceEnv` in `_shared/supabase-env.ts`

---

### Cron shared secret

Used by: `process-email-outbox`

```
Scheduler → POST /process-email-outbox  +  X-Outbox-Cron-Secret: <secret>
    ↓
timingSafeEqual(provided, OUTBOX_CRON_SECRET)
    ↓
createClient(url, SUPABASE_SERVICE_ROLE_KEY)               ← RPC + outbox writes
```

The cron secret is a long random string stored as `OUTBOX_CRON_SECRET`. The comparison uses a constant-time function to prevent timing attacks. Do **not** expose the function URL without this header. See `supabase/EMAIL_OUTBOX.md` for scheduling options.

Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OUTBOX_CRON_SECRET`, `RESEND_API_KEY` (or `RESEND_TEST_API_KEY` in staging)
Helper: `requireSupabaseServiceEnv` in `_shared/supabase-env.ts`, `timingSafeEqual` in `_shared/crypto.ts`

---

### Service role bearer (pg_cron / internal)

Used by: `release-payout` (`verify_jwt = false`)

```
Caller → POST /release-payout  +  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
    ↓
timingSafeEqual(bearer, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))
    ↓
createClient(url, SUPABASE_SERVICE_ROLE_KEY)               ← Stripe transfer + DB updates
```

Scheduled jobs should pass the same service role JWT stored in Supabase Vault (see Layer 6 migration `fn_auto_complete_bookings`). Do not expose this URL without the bearer.

Required env: same as Stripe functions + `SUPABASE_SERVICE_ROLE_KEY`

---

## Shared utilities (`_shared/`)

| File | Exports | Used by |
|------|---------|---------|
| `env.ts` | `isStaging()` | all five functions |
| `http.ts` | `corsHeaders(…extra)`, `jsonResponse(body, status, cors)`, `errorMessage(e)` | all five functions |
| `supabase-env.ts` | `requireSupabaseUserEnv(cors)`, `requireSupabaseServiceEnv(cors)` | all five functions |
| `app-url.ts` | `getAppBaseUrl(req?)` | `create-stripe-connect-account`, `sync-stripe-account-status`, `send-thread-message`, `stripe-webhook`, `cancel-booking`, `release-payout` |
| `stripe-client.ts` | `getStripe()` | `create-stripe-connect-account`, `stripe-webhook`, `sync-stripe-account-status`, `cancel-booking`, `release-payout` |
| `stripe-account.ts` | `stripeAccountNeedsAction(account)` | `stripe-webhook`, `sync-stripe-account-status` |
| `crypto.ts` | `timingSafeEqual(a, b)` | `process-email-outbox`, `release-payout` |
| `email-outbox.ts` | `enqueueEmailOutbox`, `maybeEnqueuePayoutsLiveEmail` | `send-thread-message`, `stripe-webhook`, `sync-stripe-account-status`, `cancel-booking`, `release-payout` |

---

## Email flow

```
send-thread-message
stripe-webhook           ──enqueue──▶  email_outbox table
sync-stripe-account-status

                                           ▼  (every 1–2 min, cron)

                                  process-email-outbox
                                      ↓         ↓
                               Resend API    DB status update
```

See `supabase/EMAIL_OUTBOX.md` for secrets, scheduling, and troubleshooting.

---

## Required secrets (all functions)

| Secret | Functions | Notes |
|--------|-----------|-------|
| `SUPABASE_URL` | all | Auto-injected by Supabase runtime |
| `SUPABASE_ANON_KEY` | user-facing three | Auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | all | Keep strictly server-side |
| `STRIPE_SECRET_KEY` | Stripe functions (prod) | |
| `STRIPE_TEST_SECRET_KEY` | Stripe functions (staging) | |
| `STRIPE_WEBHOOK_SECRET_PLATFORM` | `stripe-webhook` | Signing secret for the "Your account" event destination |
| `STRIPE_WEBHOOK_SECRET_CONNECT` | `stripe-webhook` | Signing secret for the "Connected accounts" event destination |
| `STRIPE_CONNECT_DEFAULT_COUNTRY` | `create-stripe-connect-account` | Defaults to `US` |
| `APP_BASE_URL` | user-facing three + webhook | Falls back to request `Origin` then `localhost:5173` |
| `OUTBOX_CRON_SECRET` | `process-email-outbox` | |
| `RESEND_API_KEY` | `process-email-outbox` (prod) | |
| `RESEND_TEST_API_KEY` | `process-email-outbox` (staging) | |
| `EMAIL_FROM` | `process-email-outbox` | Default: `Book'D <noreply@support.jidatit.uk>` |
| `ENVIRONMENT` / `NODE_ENV` | all | Set to `staging` for staging mode |
