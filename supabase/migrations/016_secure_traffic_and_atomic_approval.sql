-- Restrict traffic writes to a narrow atomic RPC and make tool approval a
-- single transaction. Both functions validate their caller and inputs.

drop policy if exists "Enable insert for anonymous users" on public.traffic_stats;
drop policy if exists "Enable update for anonymous users" on public.traffic_stats;

create or replace function public.record_tool_visit(p_tool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tool_id is null or not exists (select 1 from public.tools where id = p_tool_id) then
    raise exception 'Unknown tool';
  end if;

  insert into public.traffic_stats (tool_id, date, visitors, page_views)
  values (p_tool_id, current_date, 1, 1)
  on conflict (tool_id, date) do update set
    visitors = public.traffic_stats.visitors + 1,
    page_views = public.traffic_stats.page_views + 1;
end;
$$;

revoke all on function public.record_tool_visit(uuid) from public;
grant execute on function public.record_tool_visit(uuid) to anon, authenticated;

create or replace function public.approve_pending_tool(
  p_pending_tool_id uuid,
  p_tool_data jsonb default '{}'::jsonb
)
returns public.tools
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending public.pending_tools%rowtype;
  v_tool public.tools%rowtype;
begin
  if auth.role() <> 'authenticated'
     or coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'admin' then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;

  select * into v_pending
  from public.pending_tools
  where id = p_pending_tool_id
  for update;

  if not found then
    raise exception 'Pending tool not found' using errcode = 'P0002';
  end if;
  if v_pending.status <> 'pending' then
    raise exception 'Submission already reviewed' using errcode = '23514';
  end if;

  insert into public.tools (
    name, description, full_description, url, logo_url,
    pricing_type, pricing_start_at, pricing_summary, pricing_details,
    pricing_currency, billing_period, pricing_url, pricing_verified_at,
    korean_support_level, is_verified, is_domestic, has_api, api_url,
    api_tutorial_key, api_tutorial_example, api_tutorial_pricing, ai_type,
    key_benefits, best_for, limitations, verification_sources, verified_at
  ) values (
    coalesce(nullif(trim(p_tool_data->>'name'), ''), v_pending.name),
    coalesce(nullif(trim(p_tool_data->>'description'), ''), v_pending.description),
    nullif(trim(p_tool_data->>'full_description'), ''),
    coalesce(nullif(trim(p_tool_data->>'url'), ''), v_pending.url),
    coalesce(nullif(trim(p_tool_data->>'logo_url'), ''), v_pending.logo_url),
    coalesce(nullif(p_tool_data->>'pricing_type', ''), 'Free'),
    nullif(trim(p_tool_data->>'pricing_start_at'), ''),
    nullif(trim(p_tool_data->>'pricing_summary'), ''),
    case when jsonb_typeof(p_tool_data->'pricing_details') = 'array'
      then array(select jsonb_array_elements_text(p_tool_data->'pricing_details')) else null end,
    nullif(trim(p_tool_data->>'pricing_currency'), ''),
    nullif(trim(p_tool_data->>'billing_period'), ''),
    nullif(trim(p_tool_data->>'pricing_url'), ''),
    nullif(p_tool_data->>'pricing_verified_at', '')::timestamptz,
    coalesce(nullif(p_tool_data->>'korean_support_level', ''), 'None'),
    true,
    coalesce((p_tool_data->>'is_domestic')::boolean, false),
    coalesce((p_tool_data->>'has_api')::boolean, false),
    nullif(trim(p_tool_data->>'api_url'), ''),
    nullif(trim(p_tool_data->>'api_tutorial_key'), ''),
    nullif(trim(p_tool_data->>'api_tutorial_example'), ''),
    nullif(trim(p_tool_data->>'api_tutorial_pricing'), ''),
    nullif(p_tool_data->>'ai_type', ''),
    case when jsonb_typeof(p_tool_data->'key_benefits') = 'array'
      then array(select jsonb_array_elements_text(p_tool_data->'key_benefits')) else null end,
    case when jsonb_typeof(p_tool_data->'best_for') = 'array'
      then array(select jsonb_array_elements_text(p_tool_data->'best_for')) else null end,
    case when jsonb_typeof(p_tool_data->'limitations') = 'array'
      then array(select jsonb_array_elements_text(p_tool_data->'limitations')) else null end,
    case when jsonb_typeof(p_tool_data->'verification_sources') = 'array'
      then array(select jsonb_array_elements_text(p_tool_data->'verification_sources')) else null end,
    coalesce(nullif(p_tool_data->>'verified_at', '')::timestamptz, timezone('utc'::text, now()))
  ) returning * into v_tool;

  update public.pending_tools set
    status = 'approved',
    admin_notes = nullif(trim(p_tool_data->>'admin_notes'), ''),
    reviewed_at = timezone('utc'::text, now())
  where id = p_pending_tool_id;

  return v_tool;
end;
$$;

revoke all on function public.approve_pending_tool(uuid, jsonb) from public;
revoke execute on function public.approve_pending_tool(uuid, jsonb) from anon;
grant execute on function public.approve_pending_tool(uuid, jsonb) to authenticated;
