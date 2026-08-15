-- Remove the original presentation-only home content.
delete from public.featured_promotions
where id = '7ae08316-b8e9-4605-b06f-85067b3c25a5';

delete from public.featured_works
where external_id in ('seed-youtube', 'seed-instagram', 'seed-tiktok');

delete from public.ai_technology_trends
where source_label in ('ICLR', 'CVPR', 'ICML', 'AAAI', 'NeurIPS');

-- Publish only the three strongest YouTube items that passed the collector filters.
update public.featured_works
set status = 'draft', updated_at = timezone('utc'::text, now())
where platform = 'YouTube' and status = 'approved';

with ranked as (
  select id, row_number() over (order by ai_relevance_score desc nulls last, popularity_score desc, published_at desc) as position
  from public.featured_works
  where platform = 'YouTube'
    and status in ('draft', 'approved')
    and ai_relevance_score >= 90
)
update public.featured_works as work
set status = 'approved', display_order = ranked.position, updated_at = timezone('utc'::text, now())
from ranked
where work.id = ranked.id and ranked.position <= 3;

-- Prefer OpenAlex-vetted topics; keep arXiv and zero-result topics as review candidates.
update public.ai_technology_trends
set is_active = false, updated_at = timezone('utc'::text, now())
where source_label like 'OpenAlex 자동수집 · %'
   or source_label like 'arXiv 자동수집 · %';

with ranked as (
  select id, row_number() over (
    order by coalesce((representative_papers->0->>'published_at')::date, calculated_at::date) desc,
             paper_count_7d desc
  ) as position
  from public.ai_technology_trends
  where source_label like 'OpenAlex 자동수집 · %'
    and paper_count_7d > 0
    and jsonb_array_length(representative_papers) > 0
)
update public.ai_technology_trends as trend
set is_active = true, display_order = ranked.position, updated_at = timezone('utc'::text, now())
from ranked
where trend.id = ranked.id;
