-- Create grahas table (9 Navagrahas reference)
CREATE TABLE IF NOT EXISTS grahas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR UNIQUE NOT NULL,
  position INT CHECK (position BETWEEN 0 AND 8),
  day_of_week INT CHECK (day_of_week IS NULL OR (day_of_week BETWEEN 0 AND 6)),
  color VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: Grahas are world-readable
ALTER TABLE grahas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "readable" ON grahas
  FOR SELECT USING (true);
