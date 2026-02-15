
-- ============================================================
-- MerchantHaus Secure Onboarding Schema
-- Normalized tables: merchants, principals, bank_accounts, application_secrets
-- ============================================================

-- 1. Add new columns to applications table for lifecycle tracking
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS underwriting_status text;

-- 2. Create merchants table (business + legal + processing fields)
CREATE TABLE IF NOT EXISTS public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  -- Business Profile (canonical keys)
  dba_name text,
  product_description text,
  nature_of_business text,
  dba_contact_first_name text,
  dba_contact_last_name text,
  dba_contact_phone text,
  dba_contact_email text,
  dba_address_line1 text,
  dba_address_line2 text,
  dba_city text,
  dba_state text,
  dba_zip text,
  dba_country text DEFAULT 'US',

  -- Legal Information (canonical keys)
  legal_entity_name text,
  federal_tax_id text,
  ownership_type text,
  business_formation_date text,
  state_incorporated text,
  tax_exempt boolean DEFAULT false,
  legal_address_line1 text,
  legal_address_line2 text,
  legal_city text,
  legal_state text,
  legal_zip text,
  legal_country text DEFAULT 'US',

  -- Processing Profile (canonical keys)
  monthly_volume text,
  average_transaction text,
  high_ticket text,
  percent_swiped text,
  percent_keyed text,
  percent_moto text,
  percent_ecommerce text,
  percent_b2b text,
  percent_b2c text,
  website_url text,
  sic_mcc_code text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT merchants_application_id_unique UNIQUE (application_id)
);

-- 3. Create principals table (repeatable 1-5)
CREATE TABLE IF NOT EXISTS public.principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  principal_first_name text,
  principal_last_name text,
  principal_title text,
  ownership_percent numeric,
  principal_phone text,
  principal_email text,
  principal_address_line1 text,
  principal_address_line2 text,
  principal_city text,
  principal_state text,
  principal_zip text,
  principal_country text DEFAULT 'US',
  date_of_birth text,
  ssn_last4 text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  bank_name text,
  account_holder_name text,
  account_last4 text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT bank_accounts_application_id_unique UNIQUE (application_id)
);

-- 5. Create application_secrets table (strict isolation for encrypted sensitive data)
CREATE TABLE IF NOT EXISTS public.application_secrets (
  application_id uuid PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  
  ssn_enc text,         -- AES-256-GCM encrypted full SSN (ciphertext:iv:tag)
  routing_enc text,     -- AES-256-GCM encrypted routing number
  account_enc text,     -- AES-256-GCM encrypted account number
  key_version integer DEFAULT 1,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  purged_at timestamptz
);

-- ============================================================
-- Enable RLS on all new tables
-- ============================================================

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_secrets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: merchants
-- ============================================================

-- Public insert (unauthenticated merchant applicants)
CREATE POLICY "Anyone can insert merchants"
  ON public.merchants FOR INSERT
  WITH CHECK (true);

-- Only authenticated staff can read
CREATE POLICY "Authenticated users can view merchants"
  ON public.merchants FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only authenticated staff can update
CREATE POLICY "Authenticated users can update merchants"
  ON public.merchants FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated staff can delete
CREATE POLICY "Authenticated users can delete merchants"
  ON public.merchants FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS Policies: principals
-- ============================================================

CREATE POLICY "Anyone can insert principals"
  ON public.principals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view principals"
  ON public.principals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update principals"
  ON public.principals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete principals"
  ON public.principals FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS Policies: bank_accounts
-- ============================================================

CREATE POLICY "Anyone can insert bank_accounts"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view bank_accounts"
  ON public.bank_accounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update bank_accounts"
  ON public.bank_accounts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete bank_accounts"
  ON public.bank_accounts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS Policies: application_secrets (ADMIN ONLY for read)
-- ============================================================

-- Anyone can insert (from public form via edge function)
CREATE POLICY "Anyone can insert application_secrets"
  ON public.application_secrets FOR INSERT
  WITH CHECK (true);

-- Only admins can read secrets
CREATE POLICY "Only admins can view application_secrets"
  ON public.application_secrets FOR SELECT
  USING (is_admin_email());

-- Only admins can update (for purge operations)
CREATE POLICY "Only admins can update application_secrets"
  ON public.application_secrets FOR UPDATE
  USING (is_admin_email());

-- No delete policy — secrets are purged (nullified), not deleted

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_principals_updated_at
  BEFORE UPDATE ON public.principals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Auto-Purge Trigger: when application status → 'underwriting'
-- Nullifies all encrypted values in application_secrets
-- ============================================================

CREATE OR REPLACE FUNCTION public.purge_application_secrets_on_underwriting()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'underwriting' THEN
    UPDATE public.application_secrets
    SET ssn_enc = NULL,
        routing_enc = NULL,
        account_enc = NULL,
        purged_at = now()
    WHERE application_id = NEW.id
      AND purged_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purge_secrets_on_underwriting
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.purge_application_secrets_on_underwriting();
