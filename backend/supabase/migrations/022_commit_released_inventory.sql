-- ============================================================
-- 022 — commit_inventory must deduct released-then-paid stock
--
-- Bug: when a payment attempt is declined, the webhook releases
-- the reservation (stock_quantity restored, reserved_quantity
-- back to 0). If the customer retries on the SAME PaymentIntent
-- and succeeds, commit_inventory only decremented
-- reserved_quantity — which was already 0 — so the sale never
-- left stock: a paid order whose units were simultaneously
-- sellable to others.
--
-- Fix: at commit time, the sold quantity not covered by the
-- remaining reservation (already released by a failed attempt)
-- is re-deducted from stock_quantity. Normal commits
-- (reservation still held) behave exactly as before.
-- Invariant preserved: stock + reserved = physical − sold.
-- ============================================================

CREATE OR REPLACE FUNCTION public.commit_inventory(p_reference TEXT)
RETURNS VOID AS $$
DECLARE
  v_order UUID;
  v_item RECORD;
  v_released INT;
BEGIN
  SELECT id INTO v_order
  FROM orders
  WHERE payment_reference = p_reference;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for reference %', p_reference;
  END IF;

  FOR v_item IN
    SELECT variant_id, SUM(quantity)::INT AS qty
    FROM order_items
    WHERE order_id = v_order
    GROUP BY variant_id
  LOOP
    v_released := GREATEST(
      v_item.qty - COALESCE((
        SELECT reserved_quantity FROM product_variants WHERE id = v_item.variant_id
      ), 0),
      0
    );

    UPDATE product_variants
       SET stock_quantity    = stock_quantity - v_released,
           reserved_quantity = GREATEST(reserved_quantity - v_item.qty, 0)
     WHERE id = v_item.variant_id;

    IF v_released > 0 THEN
      -- The reservation was already released (e.g. declined attempt then
      -- successful retry on the same intent). Record the re-deduction so
      -- the transaction ledger still reconciles with stock.
      INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
      VALUES (v_item.variant_id, -v_released, 'SALE', v_order);
    END IF;
  END LOOP;

  -- No 'paid' event here: markOrderPaid() already writes exactly one.
END;
$$ LANGUAGE plpgsql;
