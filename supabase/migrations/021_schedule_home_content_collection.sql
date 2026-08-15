create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'collect-home-content-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'collect-home-content-daily',
  '0 22 * * *',
  $schedule$
  select net.http_post(
    url := 'https://prkmvgwwjjseoxafckyq.supabase.co/functions/v1/collect-home-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_service_role'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $schedule$
);
