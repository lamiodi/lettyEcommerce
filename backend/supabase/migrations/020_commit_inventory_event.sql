-- ============================================================
-- 020 — Order lifecycle hygiene
--
-- commit_inventory inserted its own 'paid' order_event, but
-- markOrderPaid() (the compare-and-set source of truth) already records
-- one — every paid order ended up with two 'paid' events. Drop the
-- duplicate insert from the RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION public.commit_inventory(p_reference TEXT)
RETURNS VOID AS $$
DECLARE
  v_order UUID;
  v_item RECORD;
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
    UPDATE product_variants
       SET reserved_quantity = GREATEST(reserved_quantity - v_item.qty, 0)
     WHERE id = v_item.variant_id;
  END LOOP;

  -- No 'paid' event here: markOrderPaid() already writes exactly one.
END;
$$ LANGUAGE plpgsql;
