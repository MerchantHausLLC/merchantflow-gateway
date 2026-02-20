
-- Table to track user login sessions
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  logged_out_at timestamptz,
  duration_minutes integer GENERATED ALWAYS AS (
    CASE WHEN logged_out_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (logged_out_at - logged_in_at))::integer / 60
      ELSE NULL
    END
  ) STORED
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (is_admin_email());

-- Any authenticated user can insert their own session
CREATE POLICY "Users can insert own session"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own session (for logout)
CREATE POLICY "Users can update own session"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
