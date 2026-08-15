alter table public.featured_promotions
  add column if not exists video_url text,
  add column if not exists video_type text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'featured_promotions_video_url_check') then
    alter table public.featured_promotions add constraint featured_promotions_video_url_check
      check (video_url is null or video_url ~ '^https?://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'featured_promotions_video_type_check') then
    alter table public.featured_promotions add constraint featured_promotions_video_type_check
      check (video_type is null or video_type in ('youtube', 'direct'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'featured_promotions_video_pair_check') then
    alter table public.featured_promotions add constraint featured_promotions_video_pair_check
      check ((video_url is null and video_type is null) or (video_url is not null and video_type is not null));
  end if;
end $$;

update public.featured_promotions
set
  video_url = 'https://www.youtube.com/watch?v=AmKZCo5Dtn0',
  video_type = 'youtube',
  is_active = true,
  eyebrow = '추천 AI 서비스',
  updated_at = timezone('utc'::text, now())
where destination_url = 'https://notebooklm.google.com/';
