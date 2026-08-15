-- Route tool submissions through the submit-tool Edge Function and retain
-- auditable verification/reputation data for administrator review.

alter table public.pending_tools
  add column if not exists submitted_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists normalized_url text,
  add column if not exists root_domain text,
  add column if not exists verification_status text not null default 'review',
  add column if not exists verification_score integer not null default 0,
  add column if not exists verification_summary text,
  add column if not exists verification_signals jsonb not null default '[]'::jsonb,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists submitter_trust_score integer not null default 50;

alter table public.pending_tools
  drop constraint if exists pending_tools_verification_status_check;

alter table public.pending_tools
  add constraint pending_tools_verification_status_check
  check (verification_status in ('verified', 'review', 'failed'));

alter table public.pending_tools
  drop constraint if exists pending_tools_verification_score_check;

alter table public.pending_tools
  add constraint pending_tools_verification_score_check
  check (verification_score between 0 and 100);

create unique index if not exists pending_tools_normalized_url_unique_idx
  on public.pending_tools (normalized_url)
  where normalized_url is not null;

create index if not exists pending_tools_root_domain_idx
  on public.pending_tools (root_domain);

create table if not exists public.submitter_reputation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trust_score integer not null default 50 check (trust_score between 0 and 100),
  approved_count integer not null default 0,
  rejected_count integer not null default 0,
  last_submission_at timestamp with time zone,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.submitter_reputation enable row level security;

drop policy if exists "Users can read own submission reputation" on public.submitter_reputation;
create policy "Users can read own submission reputation"
  on public.submitter_reputation for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage submission reputation" on public.submitter_reputation;
create policy "Admins can manage submission reputation"
  on public.submitter_reputation for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');

-- No browser client may insert submissions directly. The Edge Function uses
-- the service role after authenticating and validating the caller.
drop policy if exists "Enable insert for anonymous users" on public.pending_tools;
drop policy if exists "Authenticated users can submit tools" on public.pending_tools;

create or replace function public.update_submitter_reputation_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') and new.submitted_by_user_id is not null then
    insert into public.submitter_reputation (
      user_id,
      trust_score,
      approved_count,
      rejected_count,
      last_submission_at,
      updated_at
    ) values (
      new.submitted_by_user_id,
      case when new.status = 'approved' then 55 else 35 end,
      case when new.status = 'approved' then 1 else 0 end,
      case when new.status = 'rejected' then 1 else 0 end,
      new.created_at,
      timezone('utc'::text, now())
    )
    on conflict (user_id) do update set
      trust_score = case
        when new.status = 'approved' then least(100, public.submitter_reputation.trust_score + 5)
        else greatest(0, public.submitter_reputation.trust_score - 15)
      end,
      approved_count = public.submitter_reputation.approved_count + case when new.status = 'approved' then 1 else 0 end,
      rejected_count = public.submitter_reputation.rejected_count + case when new.status = 'rejected' then 1 else 0 end,
      last_submission_at = new.created_at,
      updated_at = timezone('utc'::text, now());
  end if;
  return new;
end;
$$;

drop trigger if exists pending_tool_reputation_after_review on public.pending_tools;
create trigger pending_tool_reputation_after_review
after update of status on public.pending_tools
for each row execute function public.update_submitter_reputation_after_review();
