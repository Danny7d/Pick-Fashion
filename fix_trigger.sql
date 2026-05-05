-- ============================================================================
-- Fix: Update trigger function to use correct Supabase metadata field
-- ============================================================================

-- Drop and recreate the trigger function with correct field name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username text;
BEGIN
  -- Supabase stores signUp metadata in raw_user_meta_data (with underscores)
  v_username := NEW.raw_user_meta_data ->> 'username';
  
  -- Only insert if username is provided (skip if null/empty)
  IF v_username IS NOT NULL AND trim(v_username) <> '' THEN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, trim(v_username))
    ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username;
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- End
-- ============================================================================
