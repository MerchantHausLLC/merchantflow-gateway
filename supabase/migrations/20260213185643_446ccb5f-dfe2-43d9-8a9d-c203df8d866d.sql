
-- Drop admin-only policies
DROP POLICY IF EXISTS "Admin can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admin can update applications" ON public.applications;

-- Replace with authenticated user policies
CREATE POLICY "Authenticated users can update applications"
ON public.applications
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete applications"
ON public.applications
FOR DELETE
USING (auth.uid() IS NOT NULL);
