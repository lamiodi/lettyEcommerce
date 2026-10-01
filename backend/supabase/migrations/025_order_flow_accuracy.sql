-- ============================================================
-- 025 — order-flow accuracy fixes (audit 2026-10-01)
--
-- 1. commit_inventory: per-order reservation attribution.
--    The 022 fix computed the released share from the variant-level
--    reserved_quantity, which conflates concurrent orders: if order A's
--    declined attempt freed units that order B then reserved, A's successful
--    retry under-deducted stock (paid units stayed sellable). Attribution now
--    comes from the inventory_transactions ledger ('SALE' at reserve,
--    'RESERVATION_RELEASE' at release), which is scoped to the order.
--
-- 2. release_inventory: no longer writes its own 'cancelled' order_event.
--    Every caller (markOrderFailed, admin cancel, fulfillment update) already
--    inserts exactly one — the extra row duplicated every failure/cancel.
--
-- 3. credit_gift_card: new atomic re-credit (balance + status + transaction
--    row) used when a debited order fails, expires, is abandoned, or is
--    refunded.
--
-- 4. apply_coupon: new p_apply flag (default true, backward compatible).
--    p_apply = false validates a code WITHOUT incrementing times_used —
--    /api/coupon/validate must not consume limited-use coupons on lookup.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_tx_reference
  ON inventory_transactions (reference_id, variant_id);

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
    -- How much of this variant is still reserved BY THIS ORDER, per the
    -- ledger: reserve wrote -qty 'SALE' rows, releases wrote +qty
    -- 'RESERVATION_RELEASE' rows.
    v_reserved_by_order := COALESCE((
      SELECT SUM(-change_quantity)
      FROM inventory_transactions
      WHERE reference_id = v_order
        AND variant_id = v_item.variant_id
        AND reason = 'SALE'
    ), 0)
    + COALESCE((
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

  -- No 'cancelled' event here: callers write their own exactly once.
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. gift card re-credit
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_gift_card(
  p_gift_card_id UUID,
  p_amount NUMERIC,
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  UPDATE gift_cards
     SET current_balance = current_balance + p_amount,
         status = CASE WHEN status = 'redeemed' THEN 'active' ELSE status END,
         updated_at = NOW()
   WHERE id = p_gift_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift card % not found', p_gift_card_id;
  END IF;

  INSERT INTO gift_card_transactions (gift_card_id, order_id, amount, type)
  VALUES (p_gift_card_id, p_order_id, p_amount, 'credit');
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 4. apply_coupon with optional non-burning validation
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_customer_id UUID,
  p_currency TEXT,
  p_cart_items JSONB DEFAULT '[]'::JSONB,
  p_apply BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC,
  min_subtotal NUMERIC
) AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_customer_orders INT;
  v_discount NUMERIC;
  v_min_col  TEXT;
  v_max_col  TEXT;
  v_min      NUMERIC;
  v_max      NUMERIC;
  v_ok       BOOLEAN := false;
  v_item     JSONB;
  v_variant  UUID;
BEGIN
  -- H3: per-currency min/max column resolution
  v_min_col := 'min_subtotal_' || lower(p_currency);
  v_max_col := 'max_discount_' || lower(p_currency);

  EXECUTE format('SELECT %I FROM coupons WHERE code = $1', v_min_col)
    INTO v_min
    USING p_code;
  EXECUTE format('SELECT %I FROM coupons WHERE code = $1', v_max_col)
    INTO v_max
    USING p_code;

  IF p_apply THEN
    -- Lock the row, increment counter, and re-validate usage in a single
    -- UPDATE. This closes the over-redemption race: a 100-use coupon cannot
    -- be redeemed by >100 concurrent requests because the increment + check
    -- happen under a row lock.
    UPDATE coupons
       SET times_used = times_used + 1
     WHERE code = p_code
       AND is_active = true
       AND deleted_at IS NULL
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (usage_limit IS NULL OR times_used < usage_limit)
    RETURNING * INTO v_coupon;

    IF NOT FOUND THEN
      -- Distinguish "expired/used" from "not found" for clearer error messages.
      SELECT * INTO v_coupon FROM coupons WHERE code = p_code;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid coupon code';
      ELSIF v_coupon.deleted_at IS NOT NULL OR NOT v_coupon.is_active THEN
        RAISE EXCEPTION 'Coupon is not active';
      ELSIF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
        RAISE EXCEPTION 'Coupon is not active';
      ELSIF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Coupon has expired';
      ELSIF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'Coupon usage limit reached';
      ELSE
        RAISE EXCEPTION 'Coupon is not active';
      END IF;
    END IF;
  ELSE
    -- Read-only validation: same checks, no increment, nothing to roll back.
    SELECT * INTO v_coupon FROM coupons WHERE code = p_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid coupon code';
    ELSIF v_coupon.deleted_at IS NOT NULL OR NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'Coupon is not active';
    ELSIF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
      RAISE EXCEPTION 'Coupon is not active';
    ELSIF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= NOW() THEN
      RAISE EXCEPTION 'Coupon has expired';
    ELSIF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;
  END IF;

  -- Per-customer usage limit
  IF v_coupon.usage_limit_per_customer IS NOT NULL AND p_customer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_customer_orders
    FROM orders
    WHERE customer_id = p_customer_id AND coupon_id = v_coupon.id;
    IF v_customer_orders >= v_coupon.usage_limit_per_customer THEN
      -- Roll back our counter increment (only when we made one)
      IF p_apply THEN
        UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
      END IF;
      RAISE EXCEPTION 'Coupon usage limit per customer reached';
    END IF;
  END IF;

  -- Per-currency minimum subtotal
  IF p_subtotal < v_min THEN
    IF p_apply THEN
      UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
    END IF;
    RAISE EXCEPTION 'Subtotal does not meet coupon minimum (% required)', v_min;
  END IF;

  -- H3: applies_to gating. If the coupon is restricted to a subset,
  -- every cart item must match the allowed ids.
  IF v_coupon.applies_to <> 'all' THEN
    v_ok := false;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      v_variant := (v_item->>'variant_id')::UUID;
      IF v_coupon.applies_to = 'product' THEN
        SELECT EXISTS(
          SELECT 1 FROM product_variants v
          WHERE v.id = v_variant
            AND v.product_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_coupon.applies_to_ids)::UUID))
        ) INTO v_ok;
      ELSIF v_coupon.applies_to = 'category' THEN
        SELECT EXISTS(
          SELECT 1 FROM product_variants v
          JOIN products p ON p.id = v.product_id
          WHERE v.id = v_variant
            AND p.category_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_coupon.applies_to_ids)::UUID))
        ) INTO v_ok;
      ELSIF v_coupon.applies_to = 'collection' THEN
        SELECT EXISTS(
          SELECT 1 FROM product_variants v
          JOIN products p ON p.id = v.product_id
          JOIN collection_products cp ON cp.product_id = p.id
          WHERE v.id = v_variant
            AND cp.collection_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_coupon.applies_to_ids)::UUID))
        ) INTO v_ok;
      END IF;
      EXIT WHEN v_ok;
    END LOOP;
    IF NOT v_ok THEN
      IF p_apply THEN
        UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
      END IF;
      RAISE EXCEPTION 'Coupon does not apply to any item in the cart';
    END IF;
  END IF;

  -- Compute the discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND((p_subtotal * v_coupon.discount_value / 100)::NUMERIC, 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_subtotal);
  END IF;

  -- H3: cap by per-currency max_discount
  IF v_max IS NOT NULL AND v_discount > v_max THEN
    v_discount := v_max;
  END IF;
  -- Never exceed the subtotal
  v_discount := LEAST(v_discount, p_subtotal);

  RETURN QUERY
  SELECT
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_discount,
    v_min;
END;
$$ LANGUAGE plpgsql;
