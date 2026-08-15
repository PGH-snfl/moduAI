-- Create pending_tools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pending_tools (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  url text NOT NULL,
  name text,
  description text,
  logo_url text,
  submitted_by text, -- email or user_id if authenticated
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.pending_tools ENABLE ROW LEVEL SECURITY;

-- Policies for pending tools
CREATE POLICY IF NOT EXISTS "Enable insert for anonymous users"
  ON public.pending_tools FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON public.pending_tools FOR SELECT
  USING (true);

COMMENT ON TABLE public.pending_tools IS 'Table for storing user-submitted tool submissions awaiting approval';
