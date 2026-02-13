
-- Add service_type column to applications table to distinguish gateway-only vs processing
ALTER TABLE public.applications
ADD COLUMN service_type text DEFAULT 'processing';

-- Add a comment for clarity
COMMENT ON COLUMN public.applications.service_type IS 'Either "gateway_only" or "processing" (gateway + processing)';
