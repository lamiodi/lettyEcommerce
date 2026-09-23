-- ============================================================
-- 021 — Compact Luxury Order Numbers (Maison Format: L0XXXXXX)
--
-- Replaces the excessively long 27-character timestamp+hex order numbers
-- with the elegant, compact 8-character LETTY Maison format starting with 'L'
-- (e.g. L0328159).
--
-- Uses a PostgreSQL sequence with collision-guard verification to ensure
-- 100% uniqueness, zero collisions, and clean customer readability across
-- emails, SMS, receipts, and order tracking.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 328160
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9999999
  CYCLE;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_num BIGINT;
  v_order_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_num := nextval('public.order_number_seq');
    v_order_number := 'L' || LPAD(v_num::TEXT, 7, '0');
    SELECT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_order_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;
