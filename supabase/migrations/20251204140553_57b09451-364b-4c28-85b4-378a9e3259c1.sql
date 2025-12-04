-- Create merchants table with expanded fields for your workflow
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  lead_name TEXT NOT NULL,
  company TEXT,
  stage TEXT NOT NULL DEFAULT 'lead',
  referral_type TEXT, -- 'organic' or 'referral'
  referred_by TEXT,
  call_scheduled BOOLEAN DEFAULT false,
  application_form_sent BOOLEAN DEFAULT false,
  application_form_received BOOLEAN DEFAULT false,
  banking_info_requested BOOLEAN DEFAULT false,
  banking_info_received BOOLEAN DEFAULT false,
  docusign_sent BOOLEAN DEFAULT false,
  signed BOOLEAN DEFAULT false,
  processor TEXT,
  processor_name TEXT,
  application_complete BOOLEAN DEFAULT false,
  sent_to_admin BOOLEAN DEFAULT false,
  completeness_verified BOOLEAN DEFAULT false,
  microsite_submitted BOOLEAN DEFAULT false,
  application_status TEXT,
  integration TEXT,
  gateway TEXT,
  is_live BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can CRUD all merchants (team access)
CREATE POLICY "Authenticated users can view all merchants" 
  ON public.merchants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create merchants" 
  ON public.merchants 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update merchants" 
  ON public.merchants 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete merchants" 
  ON public.merchants 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Create profiles table for team members
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger for merchants
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();