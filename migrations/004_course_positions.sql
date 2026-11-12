ALTER TABLE site_courses
  ADD COLUMN IF NOT EXISTS most_wanted_order INT NULL,
  ADD COLUMN IF NOT EXISTS short_course_order INT NULL,
  ADD COLUMN IF NOT EXISTS master_class_order INT NULL;

UPDATE site_courses
SET most_wanted_order = COALESCE(most_wanted_order, menu_order),
    short_course_order = COALESCE(short_course_order, menu_order),
    master_class_order = COALESCE(master_class_order, menu_order)
WHERE most_wanted_order IS NULL OR short_course_order IS NULL OR master_class_order IS NULL;

ALTER TABLE site_courses
  MODIFY most_wanted_order INT NOT NULL DEFAULT 0,
  MODIFY short_course_order INT NOT NULL DEFAULT 0,
  MODIFY master_class_order INT NOT NULL DEFAULT 0;
