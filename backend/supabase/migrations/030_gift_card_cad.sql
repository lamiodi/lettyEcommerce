-- ============================================================
-- 030 — CAD in gift-card currency CHECK (go-live audit 2026-10-04)
--
-- Migration 023 added CAD to the storefront and to the orders/pricing
-- columns but missed the gift_cards.currency CHECK constraint, so creating
-- a CAD gift card fails. Widen the constraint (the auto-generated name for
-- the 003 column CHECK is gift_cards_currency_check).
-- ============================================================

ALTER TABLE public.gift_cards
  DROP CONSTRAINT IF EXISTS gift_cards_currency_check;

ALTER TABLE public.gift_cards
  ADD CONSTRAINT gift_cards_currency_check
  CHECK (currency IN ('NGN', 'USD', 'EUR', 'GBP', 'CAD', 'GHS', 'ZAR', 'KES'));
