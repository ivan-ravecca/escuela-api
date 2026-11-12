ALTER TABLE site_courses ADD COLUMN IF NOT EXISTS menu_order INT NULL;

UPDATE site_courses
SET menu_order = CASE migration_key
  WHEN 'supervision-de-higiene-hospitalaria' THEN 5
  WHEN 'lavanderia-hospitalaria' THEN 4
  ELSE sort_order
END
WHERE menu_order IS NULL;

ALTER TABLE site_courses MODIFY menu_order INT NOT NULL DEFAULT 0;
