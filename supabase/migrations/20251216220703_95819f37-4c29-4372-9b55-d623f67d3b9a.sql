-- Drop the deprecated merchants table that contains PII and has public access policies
-- This table is no longer used - the application now uses accounts/contacts/opportunities
DROP TABLE IF EXISTS public.merchants CASCADE;