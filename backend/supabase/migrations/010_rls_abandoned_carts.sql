-- ============================================================
-- Migration 010 — Lock down abandoned_carts RLS (H1)
-- The previous policy let anon users update any row. The cart
-- pipeline is service-role only; deny all public access.
-- ============================================================

DROP POLICY IF EXISTS "public_create_abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "public_update_abandoned_carts" ON abandoned_carts;

-- Cart writes are done via the service-role key (server-side) so no
-- public policies are required.
