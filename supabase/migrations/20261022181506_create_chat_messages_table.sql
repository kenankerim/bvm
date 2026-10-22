/*
# Create chat_messages table for persisted chat

1. New Tables
- `chat_messages`
  - `id` (uuid, primary key)
  - `firebase_uid` (text, not null) — Firebase Auth user ID of the sender
  - `conversation_id` (integer, not null) — which conversation the message belongs to
  - `sender` (text, not null) — 'me' or 'them'
  - `text` (text, not null) — message body
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `chat_messages`.
- Grant CRUD to `anon` and `authenticated` (the app uses Firebase Auth, not Supabase Auth,
  so the anon-key client must be able to read/write rows filtered by firebase_uid).
- Policies allow all access since auth is handled by Firebase, not Supabase.

3. Important Notes
- Messages are scoped by `conversation_id` and `firebase_uid`.
- The frontend loads messages by conversation and inserts new ones on send.
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  conversation_id integer NOT NULL,
  sender text NOT NULL DEFAULT 'me',
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon, authenticated;

DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_chat_messages" ON chat_messages;
CREATE POLICY "update_chat_messages" ON chat_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_chat_messages" ON chat_messages;
CREATE POLICY "delete_chat_messages" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);
