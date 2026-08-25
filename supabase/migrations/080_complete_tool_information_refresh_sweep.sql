-- Run small, bounded batches frequently so every due tool is checked without
-- risking a single long-running Edge Function request.

create or replace function public.queue_full_tool_information_refresh()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_count integer;
begin
  if auth.role() <> 'authenticated' or coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'admin' then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;
  update public.tools set update_last_checked_at = null, update_check_error = null
  where update_check_enabled = true;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.queue_full_tool_information_refresh() from public;
grant execute on function public.queue_full_tool_information_refresh() to authenticated;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'refresh-tool-information-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  select jobid into existing_job from cron.job where jobname = 'refresh-tool-information-sweep' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'refresh-tool-information-sweep',
  '*/5 * * * *',
  $schedule$
  select net.http_post(
    url := 'https://prkmvgwwjjseoxafckyq.supabase.co/functions/v1/refresh-tool-information',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tool_refresh_cron_secret')
    ),
    body := '{"trigger_type":"scheduled","limit":20}'::jsonb
  );
  $schedule$
);
