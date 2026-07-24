-- ============================================================
-- Migration 012 — contact_submissions, admin notification helpers
-- ============================================================

-- Public contact-form submissions. Inserted by /api/contact, viewable by
-- admins. Idempotent on re-run.
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  assigned_to UUID,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_created
  ON contact_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON contact_submissions (email);
CREATE TRIGGER trg_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS: service role bypasses (we always use supabaseAdmin from the
-- backend). Public insert is allowed via the anon-key endpoint, but
-- reads are blocked.
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_submissions_no_public_read ON contact_submissions;
CREATE POLICY contact_submissions_no_public_read ON contact_submissions
  FOR SELECT USING (false);
