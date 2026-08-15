create or replace function public.invoke_scheduled_home_content_collection()
returns bigint
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare request_id bigint;
begin
  select net.http_post(
    url := 'https://prkmvgwwjjseoxafckyq.supabase.co/functions/v1/collect-home-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_service_role'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_cron_secret')
    ),
    body := '{}'::jsonb
  ) into request_id;
  return request_id;
end;
$$;

revoke all on function public.invoke_scheduled_home_content_collection() from public, anon, authenticated;
grant execute on function public.invoke_scheduled_home_content_collection() to service_role;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'collect-home-content-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'collect-home-content-daily',
  '0 22 * * *',
  'select public.invoke_scheduled_home_content_collection();'
);
