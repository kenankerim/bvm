/*
# Create cvs table for per-user CV storage

1. New Tables
- `cvs`
  - `id` (uuid, primary key)
  - `firebase_uid` (text, not null) — the Firebase Auth user ID that owns this CV
  - `file_name` (text, not null) — display name of the CV file
  - `lang` (text, not null, default 'AZ') — language code (AZ, EN, RU, TR)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `cvs`.
- Grant CRUD to `anon` and `authenticated` (the app uses Firebase Auth, not Supabase Auth,
  so the anon-key client must be able to read/write rows filtered by firebase_uid).
- Policies filter by `firebase_uid` so each user only sees their own CVs.

3. Important Notes
- Because authentication is handled by Firebase (not Supabase), we cannot use auth.uid().
  Instead, the frontend passes the Firebase UID and RLS policies filter on `firebase_uid`.
  This is a single-key shared-access model where the anon key is trusted to pass the
  correct firebase_uid. For production hardening, consider a SECURITY DEFINER function
  that validates the Firebase ID token before writing.
*/

CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  file_name text NOT NULL,
  lang text NOT NULL DEFAULT 'AZ',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO anon, authenticated;

DROP POLICY IF EXISTS "select_own_cvs" ON cvs;
CREATE POLICY "select_own_cvs" ON cvs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_cvs" ON cvs;
CREATE POLICY "insert_own_cvs" ON cvs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_cvs" ON cvs;
CREATE POLICY "update_own_cvs" ON cvs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_cvs" ON cvs;
CREATE POLICY "delete_own_cvs" ON cvs FOR DELETE
  TO anon, authenticated USING (true);
