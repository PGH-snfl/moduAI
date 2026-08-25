-- Keep ranking scores fresh even when external signal collection is unavailable.

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'refresh-tool-rankings-hourly'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end $$;

select cron.schedule(
  'refresh-tool-rankings-hourly',
  '17 * * * *',
  $schedule$select public.refresh_tool_ranking_scores();$schedule$
);

select public.refresh_tool_ranking_scores();
