-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tools Table
create table public.tools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  full_description text,
  url text,
  logo_url text,
  pricing_type text, -- 'Free', 'Freemium', 'Paid'
  pricing_start_at text,
  korean_support_level text, -- 'Full Support', 'UI only', 'None'
  is_verified boolean default false,
  is_domestic boolean default false,
  average_rating numeric(2, 1) default 0.0,
  review_count integer default 0,
  visit_count integer default 0,
  has_api boolean default false,
  api_url text,
  api_tutorial_key text,
  api_tutorial_example text,
  api_tutorial_pricing text,
  ai_type text, -- 'Native', 'Augmented'
  key_benefits text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. News Table (Daily AI News)
create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  source text not null,
  url text not null unique, -- Prevent duplicates
  published_date text, -- Keeping as text for '2026.01.23' format or use date type
  badge text, -- 'Hot', 'New', 'Must Read'
  category text, -- 'domestic' or 'global'
  summary text, -- GPT-generated summary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Traffic Stats Table (For Future Real Data)
create table public.traffic_stats (
  id uuid default uuid_generate_v4() primary key,
  tool_id uuid references public.tools(id) on delete cascade,
  date date not null,
  visitors integer default 0,
  page_views integer default 0,
  unique(tool_id, date) -- Prevent duplicate entries per tool per day
);

-- 5. Pending Tools Table (For user submissions)
create table public.pending_tools (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  name text,
  description text,
  logo_url text,
  submitted_by text, -- email or user_id if authenticated
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone
);

-- RLS Policies (Optional but recommended: Allow read to everyone)
alter table public.categories enable row level security;
alter table public.tools enable row level security;
alter table public.news enable row level security;
alter table public.traffic_stats enable row level security;
alter table public.pending_tools enable row level security;

-- Read policies (public access)
create policy "Enable read access for all users" on public.categories for select using (true);
create policy "Enable read access for all users" on public.tools for select using (true);
create policy "Enable read access for all users" on public.news for select using (true);
create policy "Enable read access for all users" on public.traffic_stats for select using (true);

-- Traffic stats - Allow anonymous inserts for tracking
create policy "Enable insert for anonymous users" on public.traffic_stats for insert with check (true);
create policy "Enable update for anonymous users" on public.traffic_stats for update using (true) with check (true);

-- Pending tools policies
create policy "Enable insert for anonymous users" on public.pending_tools for insert with check (true);
create policy "Enable read for admin users" on public.pending_tools for select using (
  auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'
);

-- Admin only policies (for write operations)
create policy "Enable all for admin users" on public.tools for all using (
  auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'
) with check (
  auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'
);
create policy "Enable all for admin users" on public.pending_tools for all using (
  auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'
) with check (
  auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'
);
