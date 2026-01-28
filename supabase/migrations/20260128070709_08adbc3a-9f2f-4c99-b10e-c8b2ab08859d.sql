-- Add partner_id column to simulations table for tracking partner attribution
ALTER TABLE public.simulations 
ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- Create index for efficient partner-based queries and statistics
CREATE INDEX idx_simulations_partner_id ON public.simulations(partner_id);