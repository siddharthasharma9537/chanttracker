-- Create achievements table (badge definitions)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  icon_emoji VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: Achievements are world-readable (no RLS needed, but enable for consistency)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "readable" ON achievements
  FOR SELECT USING (true);
