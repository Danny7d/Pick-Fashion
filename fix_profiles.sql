-- ============================================================================
-- Pick Fashion: profiles.username + login by username (FIXED VERSION)
-- Run once (safe to re-run)
-- ============================================================================

-- Step 1: Clean up triggers on auth.users (safe even if table doesn't exist)
DO $$
BEGIN
  -- Drop trigger if exists (ignores errors)
  BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Step 2: Drop functions (safe)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_username_available(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_email_for_username(text) CASCADE;

-- Step 3: Drop policies first (they depend on table)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "profiles select own" ON public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Step 4: Drop trigger on profiles (safe)
DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS set_profiles_updated_at_trigger ON public.profiles';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Step 5: Drop the table (this cascade drops indexes too)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 6: Recreate the table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Usernames for Pick Fashion; filled from auth signUp user_metadata.username';

-- Step 7: Create unique index for username (case-insensitive)
CREATE UNIQUE INDEX profiles_username_lower_key
  ON public.profiles (lower(trim(username)));

-- Step 8: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at();

-- Step 9: Trigger: copy username from auth.users.metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := NEW.raw_user_metadata ->> 'username';
  
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, v_username)
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username;

  RETURN NEW;
END;
$$;

-- Step 10: Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 12: Create policies
CREATE POLICY "profiles select own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 13: RPC functions
CREATE OR REPLACE FUNCTION public.is_username_available(request_username text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(trim(username)) = lower(trim(request_username))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_email_for_username(login_username text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT au.email
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE lower(trim(p.username)) = lower(trim(login_username))
  LIMIT 1;
$$;

-- Step 14: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;

-- Step 15: Revoke access to internal function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- ============================================================================
-- End
-- ============================================================================
