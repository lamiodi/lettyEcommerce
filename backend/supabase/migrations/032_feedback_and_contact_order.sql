-- ============================================================
-- 032 — feedback score persistence + contact order context
--
-- 1. feedback_ratings: the satisfaction-survey email links to
--    /feedback?score=N&order=X; until now nothing stored the score.
--    One row per confirmed rating (the page requires an explicit confirm
--    click, so email-prefetch bots cannot create rows).
--
-- 2. contact_submissions.order_number: the contact form now captures an
--    optional order number so the satisfaction survey can include it in
--    its rating links (and concierge sees the order without asking).
-- ============================================================

CREATE TABLE IF NOT EXISTS feedback_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
  order_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_ratings_created
  ON feedback_ratings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_ratings_order
  ON feedback_ratings (order_number)
  WHERE order_number IS NOT NULL;

-- Sensitive: only the backend (service role) reads/writes.
ALTER TABLE feedback_ratings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS order_number TEXT;
