-- ============================================================
-- 018 — Order number collision safety
--
-- The old generator used a 6-hex-char random suffix (~16.7M codes per
-- day): a 50% collision probability at ~4,800 orders/day, and any
-- collision aborted a live checkout. Lengthen the suffix to 12 hex
-- chars (~2.8e14 per day) and fix the volatility label (the function
-- calls NOW()/random(), so it is VOLATILE, not IMMUTABLE).
--
-- The application also retries the order insert on a unique violation
-- (see buildOrder), so even the residual birthday-paradox risk is
-- absorbed transparently.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  suffix TEXT;
BEGIN
  suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  RETURN 'LETTY-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(suffix);
END;
$$ LANGUAGE plpgsql VOLATILE;
