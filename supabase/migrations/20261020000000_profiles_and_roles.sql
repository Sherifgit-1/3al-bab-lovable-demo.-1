-- 3al-BaB (عالباب) Supabase Schema Migration: Profiles, Roles & Security
-- Migration: 20261020000000_profiles_and_roles.sql

-- 1. Create Profiles Table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'MERCHANT', 'DRIVER', 'ADMIN')),
  phone TEXT,
  business_name TEXT,
  category TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Merchants Table for Merchant Role Details
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT,
  category TEXT DEFAULT 'متاجر متنوعة',
  address TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 5.0,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Drivers Table for Driver Role Details
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT DEFAULT 'سكوتر كهربائي ذكي',
  code TEXT UNIQUE,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_DUTY', 'DELIVERING', 'OFFLINE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function to check if the caller is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin can read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND (role != 'ADMIN' OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- 7. RLS Policies for Merchants
DROP POLICY IF EXISTS "Anyone can read merchant details" ON public.merchants;
CREATE POLICY "Anyone can read merchant details"
  ON public.merchants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Merchants can insert or update own store" ON public.merchants;
CREATE POLICY "Merchants can insert or update own store"
  ON public.merchants FOR ALL
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 8. RLS Policies for Drivers
DROP POLICY IF EXISTS "Anyone can read active driver details" ON public.drivers;
CREATE POLICY "Anyone can read active driver details"
  ON public.drivers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Drivers can insert or update own record" ON public.drivers;
CREATE POLICY "Drivers can insert or update own record"
  ON public.drivers FOR ALL
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 9. Automatic Trigger to Sync auth.users to public.profiles on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  driver_code TEXT;
BEGIN
  -- Prevent privilege escalation: never allow untrusted client metadata to assign 'ADMIN'
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'CUSTOMER');
  IF assigned_role = 'ADMIN' THEN
    assigned_role := 'CUSTOMER';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    phone,
    business_name,
    category,
    address
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    assigned_role,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'businessName',
    NEW.raw_user_meta_data->>'category',
    NEW.raw_user_meta_data->>'address'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();

  -- If merchant role, ensure merchant record exists
  IF assigned_role = 'MERCHANT' THEN
    INSERT INTO public.merchants (
      id,
      name,
      business_name,
      owner_name,
      category,
      address,
      phone
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'businessName', NEW.raw_user_meta_data->>'name', 'متجر معتمد'),
      COALESCE(NEW.raw_user_meta_data->>'businessName', NEW.raw_user_meta_data->>'name', 'متجر معتمد'),
      NEW.raw_user_meta_data->>'name',
      COALESCE(NEW.raw_user_meta_data->>'category', 'متاجر متنوعة'),
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- If driver role, generate code and ensure driver record exists
  IF assigned_role = 'DRIVER' THEN
    driver_code := 'C-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    INSERT INTO public.drivers (
      id,
      name,
      phone,
      vehicle,
      code,
      status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'مندوب توصيل'),
      NEW.raw_user_meta_data->>'phone',
      'سكوتر كهربائي ذكي',
      driver_code,
      'AVAILABLE'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Attach Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
