-- ============================================================
-- 028 — inventory ledger correctness + RLS hardening (go-live audit 2026-10-04)
--
-- 1. commit_inventory: the 025 rewrite attributed an order's still-reserved
--    units by ADDING the RESERVATION_RELEASE rows to the SALE rows. Release
--    rows are positive stock deltas, so the sum was qty + released instead
--    of qty - released, v_released was always 0, and a declined-then-retried
--    payment (release on payment_failed, success on the retry) never
--    re-deducted stock: a paid order whose units stayed sellable. Attribution
--    now nets the ledger — still-reserved = SUM(-change_quantity) over BOTH
--    reasons. Note: pre-028 release rows log the full order qty (fixed in
--    section 2), so an old partially-released order over-deducts on commit;
--    only reachable for pending/failed test orders retried post-deploy.
--
-- 2. release_inventory: log the quantity actually released
--    (LEAST(reserved_quantity, order qty)), not the full order qty.
--
-- 3. reserve_inventory: the guard double-counted the reservation. The UPDATE
--    itself moves units from stock_quantity into reserved_quantity
--    (invariant: stock + reserved = physical - sold), so the only question
--    is whether the shelf has them: stock_quantity >= qty. The old
--    stock - reserved >= qty throttled concurrent buyers to ~half the shelf.
--
-- 4. increment_coupon_usage: locked, limit-checked usage increment — the
--    mirror of increment_coupon_usage_decrement. Re-burns the coupon use
--    that was refunded when a failed order's retry succeeds.
--
-- 5. RLS: password_reset_tokens (026) and gift_card_transactions (003) were
--    created outside migration 005 and shipped with RLS disabled. Enable
--    deny-all RLS on both; the service role bypasses RLS and no anon
--    policies are added, matching the 005 strategy for sensitive tables.
-- ============================================================

-- ------------------------------------------------------------
-- 1 + 2. inventory commit / release
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commit_inventory(p_reference TEXT)
RETURNS VOID AS $$
DECLARE
  v_order UUID;
  v_item RECORD;
  v_reserved_by_order INT;
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
    -- How much of this variant THIS ORDER still holds, per the ledger:
    -- reserve wrote -qty 'SALE' rows; releases wrote +qty 'RESERVATION_RELEASE'
    -- rows (stock back up). NET them — do not add them.
    v_reserved_by_order := COALESCE((
      SELECT SUM(-change_quantity)
      FROM inventory_transactions
      WHERE reference_id = v_order
        AND variant_id = v_item.variant_id
        AND reason = 'SALE'
    ), 0)
    - COALESCE((
      SELECT SUM(change_quantity)
      FROM inventory_transactions
      WHERE reference_id = v_order
        AND variant_id = v_item.variant_id
        AND reason = 'RESERVATION_RELEASE'
    ), 0);

    v_released := GREATEST(v_item.qty - v_reserved_by_order, 0);

    UPDATE product_variants
       SET stock_quantity    = stock_quantity - v_released,
           reserved_quantity = GREATEST(reserved_quantity - v_reserved_by_order, 0)
     WHERE id = v_item.variant_id;

    IF v_released > 0 THEN
      -- The reservation was already released (declined attempt then
      -- successful retry on the same intent): re-deduct so the ledger still
      -- reconciles with stock.
      INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
      VALUES (v_item.variant_id, -v_released, 'SALE', v_order);
    END IF;
  END LOOP;

  -- No 'paid' event here: markOrderPaid() already writes exactly one.
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.release_inventory(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_reserved INT;
  v_release INT;
BEGIN
  FOR v_item IN
    SELECT variant_id, SUM(quantity)::INT AS qty
    FROM order_items
    WHERE order_id = p_order_id
    GROUP BY variant_id
  LOOP
    SELECT reserved_quantity INTO v_reserved
    FROM product_variants
    WHERE id = v_item.variant_id;

    v_release := LEAST(COALESCE(v_reserved, 0), v_item.qty);

    IF v_release > 0 THEN
      UPDATE product_variants
         SET stock_quantity    = stock_quantity + v_release,
             reserved_quantity = reserved_quantity - v_release
       WHERE id = v_item.variant_id;

      INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
      VALUES (v_item.variant_id, v_release, 'RESERVATION_RELEASE', p_order_id);
    END IF;
  END LOOP;

  -- No 'cancelled' event here: callers write their own exactly once.
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. reserve_inventory with the corrected shelf guard
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_inventory(
  p_order_id UUID,
  p_items JSONB
) RETURNS VOID AS $$
DECLARE
  item JSONB;
  var_id UUID;
  qty INT;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Invalid items payload';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    var_id := (item->>'variant_id')::UUID;
    qty   := (item->>'quantity')::INT;

    IF qty IS NULL OR qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for variant %', var_id;
    END IF;

    -- The UPDATE moves units from stock_quantity into reserved_quantity
    -- (stock + reserved = physical - sold), so guard on the shelf alone.
    UPDATE product_variants
       SET stock_quantity    = stock_quantity - qty,
           reserved_quantity = reserved_quantity + qty
     WHERE id = var_id
       AND is_active = true
       AND stock_quantity >= qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Out of stock for variant %', var_id;
    END IF;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (var_id, -qty, 'SALE', p_order_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 4. coupon usage re-burn
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
     SET times_used = times_used + 1
   WHERE id = p_coupon_id
     AND is_active = true
     AND deleted_at IS NULL
     AND (starts_at IS NULL OR starts_at <= NOW())
     AND (expires_at IS NULL OR expires_at > NOW())
     AND (usage_limit IS NULL OR times_used < usage_limit);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon % can no longer be used', p_coupon_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 5. RLS on tables created outside migration 005
-- ------------------------------------------------------------
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
