-- Add priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority text DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high'));