-- ============================================================
-- Migration 013 — Multi-currency daily metrics
-- Adds per-currency revenue columns so the admin analytics tile
-- can report EUR/GBP/GHS/ZAR/KES alongside the existing USD/NGN.
-- Triggers an ON CONFLICT update to keep the unique key on
-- `metric_date` working with the new columns.
-- ============================================================

ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS total_revenue_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_ghs NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_zar NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_order_value_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_order_value_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_order_value_ngn NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Drop & recreate the upsert RPC to add the new per-currency deltas.
DROP FUNCTION IF EXISTS public.upsert_daily_metrics(DATE, INT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INT);

CREATE OR REPLACE FUNCTION public.upsert_daily_metrics(
  p_date DATE,
  p_orders_delta INT,
  p_revenue_usd_delta NUMERIC,
  p_revenue_eur_delta NUMERIC,
  p_revenue_gbp_delta NUMERIC,
  p_revenue_ngn_delta NUMERIC,
  p_revenue_ghs_delta NUMERIC,
  p_revenue_zar_delta NUMERIC,
  p_revenue_kes_delta NUMERIC,
  p_new_customers_delta INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_metrics (
    metric_date, total_orders,
    total_revenue_usd, total_revenue_eur, total_revenue_gbp,
    total_revenue_ngn, total_revenue_ghs, total_revenue_zar, total_revenue_kes,
    new_customers
  ) VALUES (
    p_date, p_orders_delta,
    p_revenue_usd_delta, p_revenue_eur_delta, p_revenue_gbp_delta,
    p_revenue_ngn_delta, p_revenue_ghs_delta, p_revenue_zar_delta, p_revenue_kes_delta,
    p_new_customers_delta
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_orders      = daily_metrics.total_orders      + EXCLUDED.total_orders,
    total_revenue_usd = daily_metrics.total_revenue_usd + EXCLUDED.total_revenue_usd,
    total_revenue_eur = daily_metrics.total_revenue_eur + EXCLUDED.total_revenue_eur,
    total_revenue_gbp = daily_metrics.total_revenue_gbp + EXCLUDED.total_revenue_gbp,
    total_revenue_ngn = daily_metrics.total_revenue_ngn + EXCLUDED.total_revenue_ngn,
    total_revenue_ghs = daily_metrics.total_revenue_ghs + EXCLUDED.total_revenue_ghs,
    total_revenue_zar = daily_metrics.total_revenue_zar + EXCLUDED.total_revenue_zar,
    total_revenue_kes = daily_metrics.total_revenue_kes + EXCLUDED.total_revenue_kes,
    new_customers     = daily_metrics.new_customers     + EXCLUDED.new_customers,
    avg_order_value_usd = CASE
      WHEN (daily_metrics.total_orders + EXCLUDED.total_orders) > 0
        THEN (daily_metrics.total_revenue_usd + EXCLUDED.total_revenue_usd)
             / (daily_metrics.total_orders + EXCLUDED.total_orders)
        ELSE 0
    END,
    avg_order_value_eur = CASE
      WHEN (daily_metrics.total_orders + EXCLUDED.total_orders) > 0
        THEN (daily_metrics.total_revenue_eur + EXCLUDED.total_revenue_eur)
             / (daily_metrics.total_orders + EXCLUDED.total_orders)
        ELSE 0
    END,
    avg_order_value_gbp = CASE
      WHEN (daily_metrics.total_orders + EXCLUDED.total_orders) > 0
        THEN (daily_metrics.total_revenue_gbp + EXCLUDED.total_revenue_gbp)
             / (daily_metrics.total_orders + EXCLUDED.total_orders)
        ELSE 0
    END,
    avg_order_value_ngn = CASE
      WHEN (daily_metrics.total_orders + EXCLUDED.total_orders) > 0
        THEN (daily_metrics.total_revenue_ngn + EXCLUDED.total_revenue_ngn)
             / (daily_metrics.total_orders + EXCLUDED.total_orders)
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;
