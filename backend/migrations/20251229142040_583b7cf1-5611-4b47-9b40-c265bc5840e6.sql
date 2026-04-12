-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('pet_owner', 'shelter', 'veterinarian');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  organization_name TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create pets table
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  gender TEXT,
  description TEXT,
  image_url TEXT,
  is_for_adoption BOOLEAN DEFAULT false,
  shelter_name TEXT,
  location TEXT,
  vaccinated BOOLEAN DEFAULT false,
  neutered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create adoption_requests table
CREATE TABLE public.adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shelter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment_requests table
CREATE TABLE public.treatment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lost_found_reports table
CREATE TABLE public.lost_found_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'lost' or 'found'
  pet_name TEXT,
  species TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  description TEXT,
  location TEXT NOT NULL,
  date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
  contact_info TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create injured_reports table
CREATE TABLE public.injured_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  species TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  severity TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_vet_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injured_reports ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Pets policies
CREATE POLICY "Anyone can view pets for adoption"
ON public.pets FOR SELECT
USING (is_for_adoption = true);

CREATE POLICY "Owners can view their own pets"
ON public.pets FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Pet owners can create pets"
ON public.pets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'pet_owner'));

CREATE POLICY "Pet owners can update their pets"
ON public.pets FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'pet_owner'));

CREATE POLICY "Pet owners can delete their pets"
ON public.pets FOR DELETE
TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'pet_owner'));

-- Shelters can create pets for adoption
CREATE POLICY "Shelters can create pets"
ON public.pets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'shelter'));

CREATE POLICY "Shelters can update their pets"
ON public.pets FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'shelter'));

-- Adoption requests policies
CREATE POLICY "Requesters can view their own adoption requests"
ON public.adoption_requests FOR SELECT
TO authenticated
USING (auth.uid() = requester_id);

CREATE POLICY "Shelters can view adoption requests for their pets"
ON public.adoption_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'shelter') AND 
  EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_id AND pets.owner_id = auth.uid())
);

CREATE POLICY "Users can create adoption requests"
ON public.adoption_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Shelters can update adoption requests for their pets"
ON public.adoption_requests FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'shelter') AND 
  EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_id AND pets.owner_id = auth.uid())
);

-- Treatment requests policies
CREATE POLICY "Pet owners can view their treatment requests"
ON public.treatment_requests FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Veterinarians can view all treatment requests"
ON public.treatment_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'veterinarian'));

CREATE POLICY "Pet owners can create treatment requests"
ON public.treatment_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'pet_owner'));

CREATE POLICY "Veterinarians can update treatment requests"
ON public.treatment_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'veterinarian'));

-- Lost found reports policies
CREATE POLICY "Anyone can view active lost found reports"
ON public.lost_found_reports FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can view their own reports"
ON public.lost_found_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
ON public.lost_found_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update their own reports"
ON public.lost_found_reports FOR UPDATE
TO authenticated
USING (auth.uid() = reporter_id);

-- Injured reports policies
CREATE POLICY "Reporters can view their own injured reports"
ON public.injured_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Veterinarians can view all injured reports"
ON public.injured_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'veterinarian'));

CREATE POLICY "Authenticated users can create injured reports"
ON public.injured_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Veterinarians can update injured reports"
ON public.injured_reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'veterinarian'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adoption_requests_updated_at
  BEFORE UPDATE ON public.adoption_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_requests_updated_at
  BEFORE UPDATE ON public.treatment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_found_reports_updated_at
  BEFORE UPDATE ON public.lost_found_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();