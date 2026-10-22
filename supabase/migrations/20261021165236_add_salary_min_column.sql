/*
# Add salary_min column to vacancies for sorting

1. Modified Tables
- `vacancies` — add `salary_min` integer column to support "highest salary" sorting.
  Derived from the text salary field's lower bound. Existing rows backfilled.
2. Security
- No policy changes (column is read-only for anon).
*/

ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_min integer NOT NULL DEFAULT 0;

-- Backfill from existing salary text values
UPDATE vacancies
SET salary_min = CAST((regexp_match(salary, '(\d+)'))[1] AS integer)
WHERE salary_min = 0 AND salary ~ '^\d+';
