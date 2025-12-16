-- Add sla_status column for manual override of SLA status
ALTER TABLE public.opportunities
ADD COLUMN sla_status text DEFAULT NULL;

-- NULL means auto-calculated, 'green' = ok, 'amber' = warning, 'red' = critical