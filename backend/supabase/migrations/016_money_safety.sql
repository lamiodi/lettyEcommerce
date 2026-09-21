-- ============================================================
-- 016 — Money & order lifecycle safety
--
--  * orders.refunded_amount: cumulative refund tracking so partial
--    refunds can be capped at the order total and concurrent refunds
--    can be serialized (compare-and-set in refundOrderAction).
--  * release_inventory: idempotent — only returns what is actually
--    reserved, so repeated cancels can no longer inflate stock.
--  * orders.paid_at: used by dashboard/analytics; captured here so the
--    schema matches the code (was previously added ad-hoc / missing).
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Backfill paid_at from the earliest 'paid' event for orders that reached paid state.
UPDATE orders o
   SET paid_at = sub.paid_at
  FROM (
    SELECT order_id, MIN(created_at) AS paid_at
      FROM order_events
     WHERE event_type = 'paid'
     GROUP BY order_id
  ) sub
 WHERE o.id = sub.order_id
   AND o.payment_status IN ('paid', 'partially_refunded', 'refunded')
   AND o.paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders (paid_at DESC);

-- ------------------------------------------------------------
-- Idempotent reservation release: release only what is reserved.
-- A second call finds reserved_quantity = 0 and changes nothing.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_inventory(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT variant_id, SUM(quantity)::INT AS qty
    FROM order_items
    WHERE order_id = p_order_id
    GROUP BY variant_id
  LOOP
    UPDATE product_variants
       SET stock_quantity    = stock_quantity + LEAST(reserved_quantity, v_item.qty),
           reserved_quantity = reserved_quantity - LEAST(reserved_quantity, v_item.qty)
     WHERE id = v_item.variant_id
       AND reserved_quantity > 0;

    IF FOUND THEN
      INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
      VALUES (v_item.variant_id, v_item.qty, 'RESERVATION_RELEASE', p_order_id);
    END IF;
  END LOOP;

  INSERT INTO order_events (order_id, event_type, metadata)
  VALUES (p_order_id, 'cancelled', jsonb_build_object('reason', 'inventory_release'));
END;
$$ LANGUAGE plpgsql;
