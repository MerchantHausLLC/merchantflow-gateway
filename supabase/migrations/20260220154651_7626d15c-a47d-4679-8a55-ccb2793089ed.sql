
-- Table to track broadcast message acknowledgments
CREATE TABLE public.broadcast_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_key text NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(broadcast_key, user_id)
);

ALTER TABLE public.broadcast_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Everyone can see all acknowledgments (needed for admin view)
CREATE POLICY "Authenticated users can view acknowledgments"
  ON public.broadcast_acknowledgments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own acknowledgment
CREATE POLICY "Users can acknowledge broadcasts"
  ON public.broadcast_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime so admin panel updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_acknowledgments;
