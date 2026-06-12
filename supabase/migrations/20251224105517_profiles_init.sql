-- Migration: Initialize profiles table, trigger, RLS, and indexes
-- Timestamp: 202512240354

-- 1. Create profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow users to read their own profile
CREATE POLICY select_own_profile ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY update_own_profile ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (in case trigger fails)
CREATE POLICY insert_own_profile ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles (using role metadata)
CREATE POLICY admin_read_profiles ON public.profiles
    FOR SELECT
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Allow admins to update all profiles
CREATE POLICY admin_update_profiles ON public.profiles
    FOR UPDATE
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 4. Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trig_create_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- 5. Indexes
-- Index on email for faster lookups (optional, as id is primary)
CREATE INDEX idx_profiles_email ON public.profiles (email);

-- 6. Update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();