-- ============================================================
-- 029 — post-payment exactly-once (go-live audit 2026-10-04)
--
-- executePostPayment's idempotency was check-then-insert with no unique
-- constraint: the webhook, confirm, verify and the expiry sweep can all
-- reach it within the same window and each passed the check, so orders
-- could get duplicate confirmation/owner emails and doubled metrics.
-- The partial unique index makes the claim insert itself the gate —
-- exactly one concurrent caller inserts, the rest hit a unique violation
-- and short-circuit as idempotent.
-- ============================================================

-- Exactly-once claim: keep the earliest post_payment_completed row per order
-- (the live DB had duplicates from the old check-then-insert race — they are
-- identical completion markers), then enforce uniqueness going forward.
DELETE FROM order_events a
USING order_events b
WHERE a.event_type = 'post_payment_completed'
  AND b.event_type = 'post_payment_completed'
  AND a.order_id = b.order_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_events_post_payment_completed
  ON order_events (order_id) WHERE event_type = 'post_payment_completed';
