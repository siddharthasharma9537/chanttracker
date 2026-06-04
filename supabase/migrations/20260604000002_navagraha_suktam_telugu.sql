-- Navagraha Suktam Telugu mantras migration
-- 1. Add mantra_telugu + is_archived columns
-- 2. Archive old beeja-based adhidevata/pratyadhidevata
-- 3. Update 9 graha mantras with Telugu text + correct scriptural japa counts
-- 4. Insert 9 adhidevata, 9 pratyadhidevata, 9 salutation rows from Navagraha Suktam
-- 5. Add salutation enum value
-- (Applied live via Supabase MCP 2026-06-04)
ALTER TABLE mantras ADD COLUMN IF NOT EXISTS mantra_telugu TEXT;
ALTER TABLE mantras ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TYPE mantra_type ADD VALUE IF NOT EXISTS 'salutation';
