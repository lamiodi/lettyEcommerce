-- Durable confirmation delivery is independent of fulfillment idempotency.
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  lock_token UUID,
  sent_at TIMESTAMPTZ,
  provider_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_outbox_due ON email_outbox (next_attempt_at)
  WHERE sent_at IS NULL AND attempts < 12;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON email_outbox FROM anon, authenticated;
GRANT ALL ON email_outbox TO service_role;
