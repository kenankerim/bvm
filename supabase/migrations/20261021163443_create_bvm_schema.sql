/*
# BVM Job Portal Schema

1. New Tables
- `companies` — employer companies shown in the stories carousel
  - id (uuid, pk), name (text), logo_color (text for gradient seed), created_at
- `vacancies` — job listings shown in the feed
  - id (uuid, pk), company_id (fk), title, salary, duration, location, is_vip, created_at
- `articles` — company news/success stories shown in the feed
  - id (uuid, pk), company_id (fk), title, content, category, is_vip, created_at
2. Security
- All tables are single-tenant / public (no sign-in screen).
- RLS enabled on every table with anon+authenticated full CRUD.
3. Seed Data
- 6 companies, 8 vacancies, 4 articles so the feed is populated.
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_companies" ON companies;
CREATE POLICY "anon_select_companies" ON companies FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  salary text NOT NULL,
  duration text NOT NULL,
  location text NOT NULL,
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vacancies" ON vacancies;
CREATE POLICY "anon_select_vacancies" ON vacancies FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_articles" ON articles;
CREATE POLICY "anon_select_articles" ON articles FOR SELECT
  TO anon, authenticated USING (true);

-- Seed companies
INSERT INTO companies (name) VALUES
  ('Pasha Bank'),
  ('Kapital Bank'),
  ('Azercell'),
  ('SOCAR'),
  ('Trendyol'),
  ('Yeni İş')
ON CONFLICT DO NOTHING;

-- Seed vacancies (using company names to find ids)
INSERT INTO vacancies (company_id, title, salary, duration, location, is_vip)
SELECT c.id, v.title, v.salary, v.duration, v.location, v.is_vip
FROM (VALUES
  ('Pasha Bank', 'Baş Mühasib', '1500 - 2000 AZN', 'Daimi / Tam ştat', 'Bakı', true),
  ('Kapital Bank', 'Front-End Developer', '2000 - 3500 AZN', 'Daimi / Tam ştat', 'Bakı', true),
  ('Azercell', 'Marketing Mütəxəssisi', '1200 - 1800 AZN', 'Daimi / Tam ştat', 'Bakı', false),
  ('SOCAR', 'Neft Mühəndisi', '2500 - 4000 AZN', 'Daimi / Tam ştat', 'Bakı', false),
  ('Trendyol', 'UX Designer', '1800 - 3000 AZN', 'Uzaqdan', 'Remote', true),
  ('Yeni İş', 'Satış Meneceri', '1000 - 1500 AZN', 'Daimi / Tam ştat', 'Gəncə', false),
  ('Pasha Bank', 'Risk Analitiki', '1600 - 2400 AZN', 'Daimi / Tam ştat', 'Bakı', false),
  ('Azercell', 'Data Analyst', '1900 - 2800 AZN', 'Hybrid', 'Bakı', false)
) AS v(company, title, salary, duration, location, is_vip)
JOIN companies c ON c.name = v.company
ON CONFLICT DO NOTHING;

-- Seed articles
INSERT INTO articles (company_id, title, content, category, is_vip)
SELECT c.id, a.title, a.content, a.category, a.is_vip
FROM (VALUES
  ('Kapital Bank', 'Komandamız 100 nəfəri keçdi!', 'Bu ay ərzində BVM tətbiqi vasitəsilə 15 yeni mütəxəssisi komandamıza cəlb etdik. Uğurlarımız davam edir...', 'Uğur Hekayəsi', true),
  ('Pasha Bank', '2026 İntern Proqramı Başlayır!', 'Universitet məzunları üçün 6 aylıq peşəkar təcrübə proqramına müraciətlər açıqdır. Sürətli müraciət edin.', 'Elan', true),
  ('SOCAR', 'Yenilik və Texnologiya Günü', 'Komandamızın texnologiya yenilikləri ilə tanış olması üçün xüsusi tədbir təşkil etdik.', 'Tədbir', false),
  ('Trendyol', 'Uzaqdan İş Mədəniyyəti', 'Uzaqdan iş rejimində komanda əlaqəsini gücləndirmək üçün yeni alətlər tətbiq etdik.', 'Mədəniyyət', false)
) AS a(company, title, content, category, is_vip)
JOIN companies c ON c.name = a.company
ON CONFLICT DO NOTHING;
