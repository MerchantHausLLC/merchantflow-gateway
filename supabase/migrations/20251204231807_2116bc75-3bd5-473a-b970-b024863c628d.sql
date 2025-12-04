-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view documents" 
ON public.documents FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert documents" 
ON public.documents FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents" 
ON public.documents FOR DELETE 
TO authenticated
USING (true);

-- Create storage bucket for opportunity documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('opportunity-documents', 'opportunity-documents', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'opportunity-documents');

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'opportunity-documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'opportunity-documents');