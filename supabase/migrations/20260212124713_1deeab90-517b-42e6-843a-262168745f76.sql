
-- Create call_logs table to store Quo call data
CREATE TABLE public.call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quo_call_id text UNIQUE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'outgoing',
  status text NOT NULL DEFAULT 'initiated',
  duration integer DEFAULT 0,
  phone_number text,
  participants text[],
  quo_phone_number_id text,
  initiated_by text,
  answered_at timestamptz,
  completed_at timestamptz,
  summary text[],
  next_steps text[],
  transcript jsonb,
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users only
CREATE POLICY "Authenticated users can view call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update call logs"
  ON public.call_logs FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete call logs"
  ON public.call_logs FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Allow webhook inserts without auth (service role)
CREATE POLICY "Service role can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update call logs"
  ON public.call_logs FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for call logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
