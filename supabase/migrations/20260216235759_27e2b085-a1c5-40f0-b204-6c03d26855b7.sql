
-- Create terminal_updates table for changelog entries
CREATE TABLE public.terminal_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feature' CHECK (type IN ('feature', 'fix', 'improvement', 'security')),
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terminal_updates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read updates
CREATE POLICY "Authenticated users can view terminal updates"
  ON public.terminal_updates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage updates
CREATE POLICY "Admins can insert terminal updates"
  ON public.terminal_updates FOR INSERT
  WITH CHECK (is_admin_email());

CREATE POLICY "Admins can update terminal updates"
  ON public.terminal_updates FOR UPDATE
  USING (is_admin_email());

CREATE POLICY "Admins can delete terminal updates"
  ON public.terminal_updates FOR DELETE
  USING (is_admin_email());

-- Index for efficient date-based queries
CREATE INDEX idx_terminal_updates_published_date ON public.terminal_updates (published_date DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_updates;
