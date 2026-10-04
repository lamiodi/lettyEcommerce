-- ============================================================
-- Migration 031 — contact_submissions satisfaction-survey marker
-- ============================================================

-- /api/jobs/satisfaction-survey stamps this when the post-support
-- survey email has been sent for a submission. NULL = not yet surveyed.
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS survey_sent_at TIMESTAMPTZ;

-- Job scan path: submissions old enough to survey, not yet surveyed,
-- not flagged spam. Partial index keeps the daily scan cheap.
CREATE INDEX IF NOT EXISTS idx_contact_submissions_survey_due
  ON contact_submissions (created_at)
  WHERE survey_sent_at IS NULL AND status <> 'spam';
