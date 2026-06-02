-- Create core user tables for ChantTracker

-- 1. PROFILES: User settings and metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'User',
  preferred_language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  daily_goal integer DEFAULT 500,
  theme text DEFAULT 'temple',
  haptics_enabled boolean DEFAULT true,
  chant_sound_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '08:00:00',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. CHANT_SESSIONS: Individual chanting sessions
CREATE TABLE IF NOT EXISTS chant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mantra_id uuid,  -- REFERENCES mantras(id) - added in later migration
  mode text CHECK (mode IN ('counter', 'mala', 'voice')),
  count integer DEFAULT 0,
  target integer DEFAULT 108,
  session_status text CHECK (session_status IN ('active', 'completed', 'abandoned')),
  sankalpa_id uuid,  -- Link to daily intent
  anushthana_id uuid,  -- Link to multi-day vow
  duration_seconds integer,
  japas_per_min numeric,
  voice_accuracy numeric,
  chant_date date DEFAULT CURRENT_DATE,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE chant_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON chant_sessions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON chant_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON chant_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_chant_sessions_user_date ON chant_sessions(user_id, chant_date);
CREATE INDEX idx_chant_sessions_user_status ON chant_sessions(user_id, session_status);

-- 3. SANKALPAS: Daily intention per mantra
CREATE TABLE IF NOT EXISTS sankalpas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mantra_id uuid NOT NULL,  -- REFERENCES mantras(id) - added in later migration
  for_date date DEFAULT CURRENT_DATE,
  target_count integer DEFAULT 108,
  achieved_count integer DEFAULT 0,
  sankalpa_status text CHECK (sankalpa_status IN ('active', 'completed', 'abandoned')),
  purpose text,  -- 'spiritual_growth', 'health', 'prosperity', etc.
  intention_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE sankalpas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sankalpas" ON sankalpas FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sankalpas" ON sankalpas FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sankalpas" ON sankalpas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_sankalpas_user_date ON sankalpas(user_id, for_date);

-- 4. ANUSHTHANAS: Multi-day vows
CREATE TABLE IF NOT EXISTS anushthanas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mantra_id uuid NOT NULL,  -- REFERENCES mantras(id) - added in later migration
  title text NOT NULL,
  intention text,
  daily_target_count integer DEFAULT 108,
  total_days integer NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  strict_mode boolean DEFAULT true,  -- If true, breaks reset the vow
  status text CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE anushthanas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own anushthanas" ON anushthanas FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anushthanas" ON anushthanas FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anushthanas" ON anushthanas FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. ANUSHTHANA_PROGRESS: Per-day tracking for vows
CREATE TABLE IF NOT EXISTS anushthana_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anushthana_id uuid NOT NULL REFERENCES anushthanas(id) ON DELETE CASCADE,
  progress_day integer NOT NULL,  -- 1..total_days
  achieved_count integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_anushthana_progress_vow ON anushthana_progress(anushthana_id);

-- 6. GOALS: Daily/weekly/monthly/yearly targets
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period text CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  target_japas integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, period)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON goals FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL
  USING (auth.uid() = user_id);

-- 7. STREAKS: Current and longest streaks
CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_chant_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streaks" ON streaks FOR SELECT
  USING (auth.uid() = user_id);

-- 8. USER_ACHIEVEMENTS: Track unlocked badges
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id integer NOT NULL,  -- REFERENCES achievements(id) - added in later migration
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- 9. Create demo user for testing (if doesn't exist)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@chanttracker.local',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Create demo profile
INSERT INTO profiles (id, display_name, preferred_language, timezone)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Demo User',
  'en',
  'Asia/Kolkata'
) ON CONFLICT DO NOTHING;

-- Create demo streak record
INSERT INTO streaks (user_id, current_streak, longest_streak, last_chant_date)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  1,
  1,
  CURRENT_DATE
) ON CONFLICT DO NOTHING;
