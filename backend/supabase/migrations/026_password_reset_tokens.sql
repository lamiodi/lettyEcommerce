-- 026: Password reset tokens
--
-- Single-use, time-limited tokens backing /api/customer/auth/forgot-password
-- and /api/customer/auth/reset-password. Only a SHA-256 hash of the token is
-- stored, so a DB leak cannot be replayed against the reset endpoint.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_customer
  ON password_reset_tokens(customer_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
  ON password_reset_tokens(expires_at);
