-- Add display_name column to profiles table if it doesn't exist

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text DEFAULT 'User';

-- Update the signup trigger to use the new column
CREATE OR REPLACE FUNCTION on_auth_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with defaults
  INSERT INTO public.profiles (
    id,
    display_name
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'User')
  )
  ON CONFLICT DO NOTHING;

  -- Create user streaks record with defaults if it doesn't exist
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_chant_date)
  VALUES (NEW.id, 0, 0, NULL)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
