# Email outbox (operator)

## Apply schema

Run your migration workflow so `email_outbox` and `claim_email_outbox_batch` exist (e.g. `supabase db push`).

## Edge Function secrets (Supabase Dashboard)

| Secret | Required | Notes |
|--------|----------|--------|
| `OUTBOX_CRON_SECRET` | Yes | Long random string; scheduler sends header `X-Outbox-Cron-Secret` with this value. |
| `SUPABASE_URL` | Yes | Usually auto-injected. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Worker uses service role to call RPC and update rows. |
| `EMAIL_FROM` | Recommended | Default in code: `Book'D <noreply@support.jidatit.uk>` (verified domain). |
| `RESEND_API_KEY` | Yes (prod) | Production Resend key. |
| `RESEND_TEST_API_KEY` | If staging | When `ENVIRONMENT=staging` or `NODE_ENV=staging`. |
| `STAGING_TEST_EMAIL` | Yes in staging | All staging sends go here; real vendor `to` only appears in HTML banner. |
| `ENVIRONMENT` or `NODE_ENV` | Optional | Set to `staging` for staging behavior above. |

## Schedule

Invoke **POST** `https://<project-ref>.supabase.co/functions/v1/process-email-outbox` every 1–2 minutes with:

- Header `X-Outbox-Cron-Secret: <OUTBOX_CRON_SECRET>`
- Body can be empty `{}` (Content-Type `application/json`).

Options: Supabase scheduled Edge Functions, `pg_cron` + `pg_net`, or external cron (GitHub Actions, etc.). Do not expose the function URL without the secret.

## Enqueue paths

- `stripe-webhook` and `sync-stripe-account-status` insert rows for template `payouts_live` with idempotency key `payouts_live:vendor:<vendor_id>` (one congratulations email per vendor).

## Troubleshooting

- Rows stuck `sending`: rare if worker crashes mid-flight; manually set back to `pending` or delete after verifying Resend delivery.
- `dead` status: exceeded `max_attempts`; inspect `last_error`.
