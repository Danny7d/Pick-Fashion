-- =============================================================================
-- Pick Fashion — profiles + username (FULL, idempotent migration for Supabase)
-- Dashboard → SQL Editor → paste all → Run (safe to run more than once)
-- =============================================================================
-- Signup sends options.data.username → trigger copies to public.profiles.
-- is_username_available(text) — register form (anon OK)
-- get_email_for_username(text) — login with username (anon OK)
--
-- TRIGGER SYNTAX: Supabase uses Postgres 15. If you see an error on the line
--   EXECUTE FUNCTION public.handle_new_user();
-- replace it with:
--   EXECUTE PROCEDURE public.handle_new_user();
-- =============================================================================

-- 1) Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Usernames for Pick Fashion; filled from auth signUp user_metadata.username';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Case-insensitive unique username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(trim(username)));

-- 2) Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

-- 3) New auth user → profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname text;
BEGIN
  uname := nullif(trim(NEW.raw_user_meta_data->>'username'), '');
  IF uname IS NULL THEN
    RAISE EXCEPTION 'Missing username in signup metadata';
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, uname);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4) Username available? (null / blank → false)
CREATE OR REPLACE FUNCTION public.is_username_available(request_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF request_username IS NULL OR length(trim(request_username)) = 0 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE lower(trim(p.username)) = lower(trim(request_username))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

-- 5) Username → email for password login (must see auth.users; search_path includes auth)
CREATE OR REPLACE FUNCTION public.get_email_for_username(login_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  found_email text;
BEGIN
  IF login_username IS NULL OR length(trim(login_username)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT au.email::text
  INTO found_email
  FROM auth.users AS au
  INNER JOIN public.profiles AS p ON p.id = au.id
  WHERE lower(trim(p.username)) = lower(trim(login_username))
  LIMIT 1;

  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;

-- 6) RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Optional backfill (run manually if you had users before this migration)
-- =============================================================================
-- INSERT INTO public.profiles (id, username)
-- SELECT u.id, trim(u.raw_user_meta_data->>'username')
-- FROM auth.users u
-- WHERE nullif(trim(u.raw_user_meta_data->>'username'), '') IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
-- ON CONFLICT (id) DO NOTHING;
