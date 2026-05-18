-- ADD ROLE FIELD TO PROFILES TABLE
-- This migration adds a role field to the profiles table to distinguish between
-- customers and admins. Default role is 'customer'.

-- Add role column with default value
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer'
CHECK (role IN ('customer', 'admin'));

-- Add index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'customer' role (if any exist without role)
UPDATE public.profiles
SET role = 'customer'
WHERE role IS NULL OR role = '';

-- HELPER FUNCTION TO CHECK IF USER IS ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- HELPER FUNCTION TO CHECK IF USER IS ADMIN BY ID
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;

-- UPDATE RLS POLICIES FOR PROFILES TO ALLOW ADMIN ACCESS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- New policy: Users can read own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- New policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- New policy: Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- New policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- FUNCTION TO PROMOTE USER TO ADMIN (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;

  -- Update target user role
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated;

-- FUNCTION TO DEMOTE USER TO CUSTOMER (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.demote_to_customer(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can demote users to customer';
  END IF;

  -- Prevent demoting yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot demote yourself';
  END IF;

  -- Update target user role
  UPDATE public.profiles
  SET role = 'customer'
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.demote_to_customer(uuid) TO authenticated;
