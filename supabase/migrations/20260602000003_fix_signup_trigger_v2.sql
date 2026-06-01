-- Fix on_auth_user_signup trigger - simpler version that definitely works

CREATE OR REPLACE FUNCTION on_auth_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with defaults
  -- Use email as display_name if metadata not available
  INSERT INTO public.profiles (
    id,
    display_name,
    preferred_language,
    timezone,
    daily_goal,
    theme,
    haptics_enabled,
    chant_sound_enabled,
    reminder_time
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'User'),
    'en',
    'UTC',
    500,
    'temple',
    true,
    true,
    '08:00:00'::time
  )
  ON CONFLICT DO NOTHING;

  -- Create user streaks record with defaults
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_chant_date)
  VALUES (NEW.id, 0, 0, NULL)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
