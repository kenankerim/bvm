/*
# Add vacancy status automation + posts + employer profile sections

1. Modified Tables
- `vacancies`: add `status` (text, default 'active'), `auto_end_at` (timestamptz, nullable),
  `auto_activate_at` (timestamptz, nullable)

2. New Tables
- `posts` — user-published posts/articles with optional file attachment
  - id, firebase_uid, content, file_name, file_type, created_at
- `employer_sections` — custom dynamic sections on employer profile
  - id, firebase_uid, title, is_visible, sort_order, created_at
- `employer_collaborators` — company team members
  - id, firebase_uid, name, role, created_at
- `profile_photos` — avatar and cover photos per user
  - id, firebase_uid, avatar_url, cover_url, updated_at

3. Security
- RLS enabled on all new tables.
- CRUD granted to anon + authenticated (Firebase auth model).
- All policies use true (shared access, firebase_uid-based filtering in app).

4. Important Notes
- Vacancy status automation is handled by the frontend checking auto_end_at/auto_activate_at.
- Posts block video files via accept attributes in the UI.
*/

ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS auto_end_at timestamptz;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS auto_activate_at timestamptz;

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  content text NOT NULL DEFAULT '',
  file_name text,
  file_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO anon, authenticated;

DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts" ON posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_posts" ON posts;
CREATE POLICY "insert_posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_posts" ON posts;
CREATE POLICY "update_posts" ON posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_posts" ON posts;
CREATE POLICY "delete_posts" ON posts FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS employer_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  title text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employer_sections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON employer_sections TO anon, authenticated;

DROP POLICY IF EXISTS "select_employer_sections" ON employer_sections;
CREATE POLICY "select_employer_sections" ON employer_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_employer_sections" ON employer_sections;
CREATE POLICY "insert_employer_sections" ON employer_sections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_employer_sections" ON employer_sections;
CREATE POLICY "update_employer_sections" ON employer_sections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_employer_sections" ON employer_sections;
CREATE POLICY "delete_employer_sections" ON employer_sections FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS employer_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Əməkdaş',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employer_collaborators ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON employer_collaborators TO anon, authenticated;

DROP POLICY IF EXISTS "select_employer_collaborators" ON employer_collaborators;
CREATE POLICY "select_employer_collaborators" ON employer_collaborators FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_employer_collaborators" ON employer_collaborators;
CREATE POLICY "insert_employer_collaborators" ON employer_collaborators FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_employer_collaborators" ON employer_collaborators;
CREATE POLICY "update_employer_collaborators" ON employer_collaborators FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_employer_collaborators" ON employer_collaborators;
CREATE POLICY "delete_employer_collaborators" ON employer_collaborators FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL UNIQUE,
  avatar_url text,
  cover_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON profile_photos TO anon, authenticated;

DROP POLICY IF EXISTS "select_profile_photos" ON profile_photos;
CREATE POLICY "select_profile_photos" ON profile_photos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_profile_photos" ON profile_photos;
CREATE POLICY "insert_profile_photos" ON profile_photos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_profile_photos" ON profile_photos;
CREATE POLICY "update_profile_photos" ON profile_photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_profile_photos" ON profile_photos;
CREATE POLICY "delete_profile_photos" ON profile_photos FOR DELETE TO anon, authenticated USING (true);
