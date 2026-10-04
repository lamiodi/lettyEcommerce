-- 027: Patron referral coupon (CIRCLE10) + server-side patron enforcement
--
-- 1. coupons.requires_customer — when true, apply_coupon rejects the code
--    unless the request carries an authenticated customer id. This moves the
--    "signed-in patrons only" rule server-side (it previously lived only in
--    checkout client code).
-- 2. apply_coupon re-created with the requires_customer pre-check. The check
--    runs before the usage increment, so no counter rollback is needed.
-- 3. CIRCLE10 coupon row: 10% off for signed-in patrons, one use per client,
--    £40 minimum (per-currency equivalents at fallback FX: USD 1.28, EUR
--    1.17, CAD 1.74, NGN 2050, GHS 19.5, ZAR 23.5, KES 165 per £1).

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS requires_customer BOOLEAN NOT NULL DEFAULT FALSE;

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

  -- Patron-only coupons: must be exercised by a signed-in customer.
  -- Checked before any usage increment, so no rollback is needed.
  SELECT * INTO v_coupon FROM coupons WHERE code = p_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon code';
  END IF;
  IF v_coupon.requires_customer AND p_customer_id IS NULL THEN
    RAISE EXCEPTION 'This coupon is reserved for signed-in patrons';
  END IF;

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

INSERT INTO coupons (
  code, description, discount_type, discount_value,
  min_subtotal_gbp, min_subtotal_usd, min_subtotal_eur, min_subtotal_cad,
  min_subtotal_ngn, min_subtotal_ghs, min_subtotal_zar, min_subtotal_kes,
  applies_to, usage_limit_per_customer, requires_customer, is_active
) VALUES (
  'CIRCLE10',
  'Patron Referral — 10% off for signed-in patrons, one use per client (£40 minimum)',
  'percentage', 10,
  40, 51.20, 46.80, 69.60,
  82000, 780, 940, 6600,
  'all', 1, TRUE, TRUE
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_subtotal_gbp = EXCLUDED.min_subtotal_gbp,
  min_subtotal_usd = EXCLUDED.min_subtotal_usd,
  min_subtotal_eur = EXCLUDED.min_subtotal_eur,
  min_subtotal_cad = EXCLUDED.min_subtotal_cad,
  min_subtotal_ngn = EXCLUDED.min_subtotal_ngn,
  min_subtotal_ghs = EXCLUDED.min_subtotal_ghs,
  min_subtotal_zar = EXCLUDED.min_subtotal_zar,
  min_subtotal_kes = EXCLUDED.min_subtotal_kes,
  usage_limit_per_customer = EXCLUDED.usage_limit_per_customer,
  requires_customer = EXCLUDED.requires_customer,
  is_active = EXCLUDED.is_active,
  deleted_at = NULL;
