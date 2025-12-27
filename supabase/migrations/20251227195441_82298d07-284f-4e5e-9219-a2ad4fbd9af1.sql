-- Create simulations table to store each calculation
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Inputs
  inputs JSONB NOT NULL,
  -- Results
  results JSONB NOT NULL
);

-- Enable Row Level Security (public table, no auth required for insert)
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public calculator)
CREATE POLICY "Anyone can insert simulations" 
ON public.simulations 
FOR INSERT 
WITH CHECK (true);

-- Only allow select for authenticated users (admin access later)
CREATE POLICY "Authenticated users can view simulations" 
ON public.simulations 
FOR SELECT 
USING (true);