-- Add project_code column to projects table
-- Each project gets a unique 8-character alphanumeric code
-- Used with email+mobile to generate unique assignment codes

ALTER TABLE projects
ADD COLUMN project_code VARCHAR(8) NOT NULL DEFAULT '';

-- Create index for fast lookups
CREATE INDEX idx_projects_project_code ON projects(project_code);

-- Add unique constraint
ALTER TABLE projects
ADD CONSTRAINT unique_project_code UNIQUE (project_code);

-- Generate random 8-char codes for existing projects
UPDATE projects
SET project_code =
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1)
WHERE project_code = '';

-- Trigger to generate project_code on new project creation
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code :=
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_project_code ON projects;
CREATE TRIGGER trigger_generate_project_code
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION generate_project_code();
