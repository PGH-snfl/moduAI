alter table public.submitter_reputation
  add column if not exists submission_blocked_until timestamp with time zone;

create or replace function public.update_submitter_reputation_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_score integer;
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') and new.submitted_by_user_id is not null then
    select case
      when new.status = 'approved' then least(100, coalesce(trust_score, 50) + 5)
      else greatest(0, coalesce(trust_score, 50) - 15)
    end
    into next_score
    from public.submitter_reputation
    where user_id = new.submitted_by_user_id;

    if next_score is null then
      next_score := case when new.status = 'approved' then 55 else 35 end;
    end if;

    insert into public.submitter_reputation (
      user_id,
      trust_score,
      approved_count,
      rejected_count,
      last_submission_at,
      submission_blocked_until,
      updated_at
    ) values (
      new.submitted_by_user_id,
      next_score,
      case when new.status = 'approved' then 1 else 0 end,
      case when new.status = 'rejected' then 1 else 0 end,
      new.created_at,
      case when new.status = 'rejected' and next_score <= 20 then timezone('utc'::text, now()) + interval '7 days' else null end,
      timezone('utc'::text, now())
    )
    on conflict (user_id) do update set
      trust_score = next_score,
      approved_count = public.submitter_reputation.approved_count + case when new.status = 'approved' then 1 else 0 end,
      rejected_count = public.submitter_reputation.rejected_count + case when new.status = 'rejected' then 1 else 0 end,
      last_submission_at = new.created_at,
      submission_blocked_until = case
        when new.status = 'approved' then null
        when next_score <= 20 then timezone('utc'::text, now()) + interval '7 days'
        else public.submitter_reputation.submission_blocked_until
      end,
      updated_at = timezone('utc'::text, now());
  end if;
  return new;
end;
$$;

