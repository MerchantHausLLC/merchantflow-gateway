
-- Global action items visible to all authenticated users
CREATE TABLE public.action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_by_email TEXT NOT NULL,
  assigned_to TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view action items"
  ON public.action_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create action items"
  ON public.action_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update action items"
  ON public.action_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can delete action items"
  ON public.action_items FOR DELETE
  USING (auth.uid() = created_by);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_items;
