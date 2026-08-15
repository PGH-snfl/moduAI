-- Keep main YouTube content intuitive: only videos with at least 10K views,
-- ranked by their current view count. Lower-view approved items return to review.
update public.featured_works
set status = 'draft',
    updated_at = timezone('utc'::text, now())
where platform = 'YouTube'
  and status = 'approved'
  and coalesce(view_count, 0) < 10000;

with ranked as (
  select id, row_number() over (order by view_count desc, published_at desc) as position
  from public.featured_works
  where platform = 'YouTube'
    and status = 'approved'
    and view_count >= 10000
)
update public.featured_works as work
set display_order = ranked.position,
    updated_at = timezone('utc'::text, now())
from ranked
where work.id = ranked.id;
