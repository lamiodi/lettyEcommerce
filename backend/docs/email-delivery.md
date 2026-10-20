# Confirmation emails and preferences

Apply `supabase/migrations/035_confirmation_email_outbox.sql` before deploying the backend changes. It creates the service-role-only confirmation queue. No customer data is backfilled or emailed by the migration.

Paid orders persist the original receipt payload under a unique order key. Webhooks can attempt delivery immediately. The protected `POST /api/jobs/email-retry` endpoint retries due messages independently of inventory and owner alerts. The existing 15-minute order sweep workflow calls this endpoint using `JOBS_SECRET_KEY`.

Workers claim a five-minute lease atomically. Accepted messages retain their provider ID and are not selected again. Failed attempts use exponential backoff, capped at six hours, with an admin notification after 12 unsuccessful attempts. Resend's idempotency key also protects a retry if a worker stops after the provider accepts a message but before the database records it; Resend retains those keys for 24 hours. Check the provider logs before manually resending a message with an uncertain delivery outcome.

Legacy orders processed before the outbox change are not automatically resent. Current order replays can recreate a missing queue entry without repeating fulfillment, metrics or owner alerts.

Unsubscribe links use `EMAIL_PREFERENCES_SECRET`, falling back to the existing `JWT_SECRET_KEY`. Keep this secret stable across deployments. Links open `/unsubscribe`; visiting the page does not change subscription state. Confirming sends a signed-token POST to `/api/newsletter/unsubscribe`. A successful response means the database saved `is_subscribed=false`. Optional cart, review and survey jobs check for an active newsletter subscription before sending. Essential account and order emails are independent of that preference.

Deploy the frontend and backend together so unsubscribe links have both their page and endpoint. The registered postal address remains an owner-supplied value (`EMAIL_LEGAL_ADDRESS`); do not substitute a placeholder address.

Local verification uses mock database and email transports. Run `node --import tsx --test tests/*.test.ts` from `backend` and TypeScript checks in both apps. These tests do not send customer emails or create payments.
