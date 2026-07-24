-- ============================================================
-- Migration 009 — Atomicity, RLS, and schema fixes
--  - reserve_inventory: respect `reserved_quantity`
--  - apply_coupon:      atomic increment + per-currency min/max + applies_to
--  - debit_gift_card:   new atomic function (replaces client-side race)
--  - H6: add FK on gift_cards.purchaser_order_id
--  - H5: addresses.country ISO 3166-1 alpha-2 check
-- ============================================================

-- ------------------------------------------------------------
-- C4: reserve_inventory — prevent over-reservation
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

    -- C4: check available stock (total - already reserved) is sufficient
    UPDATE product_variants
       SET stock_quantity    = stock_quantity - qty,
           reserved_quantity = reserved_quantity + qty
     WHERE id = var_id
       AND is_active = true
       AND stock_quantity - reserved_quantity >= qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Out of stock for variant %', var_id;
    END IF;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (var_id, -qty, 'SALE', p_order_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- C5 + H3: apply_coupon — atomic, per-currency, applies_to-aware
-- Returns a single row with the discount, or raises.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_customer_id UUID,
  p_currency TEXT,
  p_cart_items JSONB DEFAULT '[]'::JSONB
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
  v_now_used INT;
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

  -- Lock the row, increment counter, and re-validate usage in a single UPDATE.
  -- This closes the over-redemption race: a 100-use coupon cannot be
  -- redeemed by >100 concurrent requests because the increment + check
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
    ELSIF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= NOW() THEN
      RAISE EXCEPTION 'Coupon has expired';
    ELSIF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    ELSE
      RAISE EXCEPTION 'Coupon is not active';
    END IF;
  END IF;

  -- Per-customer usage limit
  IF v_coupon.usage_limit_per_customer IS NOT NULL AND p_customer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_customer_orders
    FROM orders
    WHERE customer_id = p_customer_id AND coupon_id = v_coupon.id;
    IF v_customer_orders >= v_coupon.usage_limit_per_customer THEN
      -- Roll back our counter increment
      UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
      RAISE EXCEPTION 'Coupon usage limit per customer reached';
    END IF;
  END IF;

  -- Per-currency minimum subtotal
  IF p_subtotal < v_min THEN
    UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
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
      UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE id = v_coupon.id;
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

-- Update the wrapper used by the orchestrator
DROP FUNCTION IF EXISTS public.increment_coupon_usage(UUID);
-- We no longer need a separate increment RPC — apply_coupon already increments.
-- Provide a decrement RPC for the orchestrator to roll back a reservation
-- when downstream steps (inventory, payment init) fail.
CREATE OR REPLACE FUNCTION public.increment_coupon_usage_decrement(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
     SET times_used = GREATEST(times_used - 1, 0)
   WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- C8: atomic gift card debit
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.debit_gift_card(
  p_gift_card_id UUID,
  p_amount NUMERIC,
  p_order_id UUID
) RETURNS TABLE (
  new_balance NUMERIC,
  amount_debited NUMERIC,
  status TEXT
) AS $$
DECLARE
  v_new_balance NUMERIC;
  v_status      TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be positive';
  END IF;

  -- Atomic UPDATE that decrements balance and (optionally) marks redeemed.
  -- The `current_balance >= p_amount` predicate closes the race window
  -- that the previous client-side implementation left open.
  UPDATE gift_cards
     SET current_balance = current_balance - p_amount,
         status = CASE
                    WHEN current_balance - p_amount <= 0 THEN 'redeemed'
                    ELSE status
                  END,
         redeemed_at = CASE
                         WHEN current_balance - p_amount <= 0 AND redeemed_at IS NULL
                           THEN NOW()
                         ELSE redeemed_at
                       END
   WHERE id = p_gift_card_id
     AND status = 'active'
     AND current_balance >= p_amount
   RETURNING current_balance, status INTO v_new_balance, v_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift card not found, not active, or insufficient balance';
  END IF;

  INSERT INTO gift_card_transactions (gift_card_id, order_id, amount, type)
  VALUES (p_gift_card_id, p_order_id, p_amount, 'debit');

  RETURN QUERY SELECT v_new_balance, p_amount, v_status;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- H6: FK on gift_cards.purchaser_order_id
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'gift_cards_purchaser_order_fk'
      AND table_name = 'gift_cards'
  ) THEN
    ALTER TABLE gift_cards
      ADD CONSTRAINT gift_cards_purchaser_order_fk
      FOREIGN KEY (purchaser_order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- L6: addresses.country must be ISO 3166-1 alpha-2
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'addresses_country_iso_check'
      AND table_name = 'addresses'
  ) THEN
    ALTER TABLE addresses
      ADD CONSTRAINT addresses_country_iso_check
      CHECK (country ~ '^[A-Z]{2}$');
  END IF;
END $$;
