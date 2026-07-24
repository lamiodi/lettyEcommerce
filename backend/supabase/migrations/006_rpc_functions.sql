-- ============================================================
-- Migration 006 — Atomic RPC Functions
-- ============================================================

-- ------------------------------------------------------------
-- reserve_inventory: atomically decrement stock and increment reserved
--                   and log to inventory_transactions.
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

    UPDATE product_variants
       SET stock_quantity    = stock_quantity - qty,
           reserved_quantity = reserved_quantity + qty
     WHERE id = var_id
       AND stock_quantity >= qty
       AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Out of stock for variant %', var_id;
    END IF;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (var_id, -qty, 'SALE', p_order_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- commit_inventory: release reserved stock after a successful payment
--                   (effectively marks the inventory as "sold out" of reservation).
-- ------------------------------------------------------------
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

  INSERT INTO order_events (order_id, event_type, metadata)
  VALUES (v_order, 'paid', jsonb_build_object('reference', p_reference));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- release_inventory: refund a reservation back to stock (cancel/timeout)
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
       SET stock_quantity    = stock_quantity + v_item.qty,
           reserved_quantity = GREATEST(reserved_quantity - v_item.qty, 0)
     WHERE id = v_item.variant_id;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (v_item.variant_id, v_item.qty, 'RESERVATION_RELEASE', p_order_id);
  END LOOP;

  INSERT INTO order_events (order_id, event_type, metadata)
  VALUES (p_order_id, 'cancelled', jsonb_build_object('reason', 'inventory_release'));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- restock_variant: admin restock helper, atomic + audited
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restock_variant(
  p_variant_id UUID,
  p_quantity INT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Restock quantity must be positive';
  END IF;

  UPDATE product_variants
     SET stock_quantity = stock_quantity + p_quantity
   WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;

  INSERT INTO inventory_transactions (variant_id, change_quantity, reason, notes, created_by)
  VALUES (p_variant_id, p_quantity, 'RESTOCK', p_notes, p_admin_id);
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- apply_coupon: validates and increments usage atomically
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_customer_id UUID
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
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code
    AND is_active = true
    AND deleted_at IS NULL
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired coupon code';
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  IF v_coupon.usage_limit_per_customer IS NOT NULL AND p_customer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_customer_orders
    FROM orders
    WHERE customer_id = p_customer_id AND coupon_id = v_coupon.id;
    IF v_customer_orders >= v_coupon.usage_limit_per_customer THEN
      RAISE EXCEPTION 'Coupon usage limit per customer reached';
    END IF;
  END IF;

  IF p_subtotal < v_coupon.min_subtotal_usd THEN
    RAISE EXCEPTION 'Subtotal does not meet coupon minimum';
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND((p_subtotal * v_coupon.discount_value / 100)::NUMERIC, 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_subtotal);
  END IF;

  RETURN QUERY
  SELECT
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_discount,
    v_coupon.min_subtotal_usd;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- increment_coupon_usage: call after order is paid
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
     SET times_used = times_used + 1
   WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- record_daily_metric: upsert a single day's metrics
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_daily_metric(
  p_date DATE,
  p_orders_delta INT,
  p_revenue_usd_delta NUMERIC,
  p_revenue_ngn_delta NUMERIC,
  p_new_customers_delta INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_metrics (
    metric_date, total_orders, total_revenue_usd, total_revenue_ngn, new_customers
  ) VALUES (
    p_date, p_orders_delta, p_revenue_usd_delta, p_revenue_ngn_delta, p_new_customers_delta
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_orders      = daily_metrics.total_orders      + EXCLUDED.total_orders,
    total_revenue_usd = daily_metrics.total_revenue_usd + EXCLUDED.total_revenue_usd,
    total_revenue_ngn = daily_metrics.total_revenue_ngn + EXCLUDED.total_revenue_ngn,
    new_customers     = daily_metrics.new_customers     + EXCLUDED.new_customers,
    avg_order_value_usd = CASE
      WHEN (daily_metrics.total_orders + EXCLUDED.total_orders) > 0
        THEN (daily_metrics.total_revenue_usd + EXCLUDED.total_revenue_usd)
             / (daily_metrics.total_orders + EXCLUDED.total_orders)
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;
