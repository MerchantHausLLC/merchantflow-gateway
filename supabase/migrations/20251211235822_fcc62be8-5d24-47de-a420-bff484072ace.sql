-- Create table for storing wizard state
CREATE TABLE public.onboarding_wizard_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL UNIQUE,
  progress INTEGER NOT NULL DEFAULT 0,
  step_index INTEGER NOT NULL DEFAULT 0,
  form_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_wizard_states ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view wizard states"
ON public.onboarding_wizard_states
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create wizard states"
ON public.onboarding_wizard_states
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update wizard states"
ON public.onboarding_wizard_states
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete wizard states"
ON public.onboarding_wizard_states
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add trigger for updating updated_at
CREATE TRIGGER update_onboarding_wizard_states_updated_at
BEFORE UPDATE ON public.onboarding_wizard_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key to opportunities table
ALTER TABLE public.onboarding_wizard_states
ADD CONSTRAINT onboarding_wizard_states_opportunity_id_fkey
FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;