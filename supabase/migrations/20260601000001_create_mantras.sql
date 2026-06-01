-- Create mantras table (system + user-custom)
CREATE TABLE IF NOT EXISTS mantras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  name_te VARCHAR,
  name_devanagari VARCHAR,
  category VARCHAR CHECK (category IN ('navagraha', 'devata', 'beeja', 'custom')),
  mantra_type VARCHAR,
  mantra_te TEXT,
  mantra_devanagari TEXT,
  adhidevata_te VARCHAR,
  adhidevata_mantra_te TEXT,
  adhidevata_mantra_devanagari TEXT,
  pratyadhidevata_te VARCHAR,
  pratyadhidevata_mantra_te TEXT,
  pratyadhidevata_mantra_devanagari TEXT,
  color VARCHAR,
  target_count INT DEFAULT 108,
  parent_graha_id UUID REFERENCES mantras(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, owner_id)
);

-- Indexes for performance
CREATE INDEX idx_mantras_category ON mantras(category);
CREATE INDEX idx_mantras_parent ON mantras(parent_graha_id);
CREATE INDEX idx_mantras_owner ON mantras(owner_id);

-- RLS: System mantras (owner_id IS NULL) are world-readable
-- User-custom mantras visible only to owner
ALTER TABLE mantras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_mantras_readable" ON mantras
  FOR SELECT USING (owner_id IS NULL);

CREATE POLICY "custom_mantras_own" ON mantras
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "insert_custom" ON mantras
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_own" ON mantras
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "delete_own" ON mantras
  FOR DELETE USING (owner_id = auth.uid());
