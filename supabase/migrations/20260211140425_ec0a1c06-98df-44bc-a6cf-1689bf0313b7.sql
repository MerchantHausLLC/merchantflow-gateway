
-- Drop overly permissive policies on contacts
DROP POLICY IF EXISTS "Anyone can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can delete contacts" ON public.contacts;

-- Replace with authenticated-only policies
CREATE POLICY "Authenticated users can view contacts"
ON public.contacts FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contacts"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts"
ON public.contacts FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contacts"
ON public.contacts FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);
