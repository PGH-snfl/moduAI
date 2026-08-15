-- Secure the live submission/approval workflow and prevent duplicate tools.

create unique index if not exists tools_url_unique_idx
  on public.tools (lower(url))
  where url is not null;

create unique index if not exists pending_tools_url_unique_idx
  on public.pending_tools (lower(url));

alter table public.pending_tools
  drop constraint if exists pending_tools_status_check;

alter table public.pending_tools
  add constraint pending_tools_status_check
  check (status in ('pending', 'approved', 'rejected'));

drop policy if exists "Enable read access for all users" on public.pending_tools;
drop policy if exists "Enable read for admin users" on public.pending_tools;
drop policy if exists "Enable all for admin users" on public.tools;
drop policy if exists "Enable all for admin users" on public.pending_tools;

create policy "Enable read for admin users"
  on public.pending_tools for select
  using (
    auth.role() = 'authenticated'
    and auth.jwt()->'app_metadata'->>'role' = 'admin'
  );

create policy "Enable all for admin users"
  on public.tools for all
  using (
    auth.role() = 'authenticated'
    and auth.jwt()->'app_metadata'->>'role' = 'admin'
  )
  with check (
    auth.role() = 'authenticated'
    and auth.jwt()->'app_metadata'->>'role' = 'admin'
  );

create policy "Enable all for admin users"
  on public.pending_tools for all
  using (
    auth.role() = 'authenticated'
    and auth.jwt()->'app_metadata'->>'role' = 'admin'
  )
  with check (
    auth.role() = 'authenticated'
    and auth.jwt()->'app_metadata'->>'role' = 'admin'
  );
