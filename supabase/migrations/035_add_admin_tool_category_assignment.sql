create or replace function public.set_tool_categories(
  p_tool_id uuid,
  p_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated'
    or auth.jwt()->'app_metadata'->>'role' <> 'admin' then
    raise exception '관리자만 도구 카테고리를 수정할 수 있습니다.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.tools where id = p_tool_id) then
    raise exception '도구를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if coalesce(array_length(p_category_ids, 1), 0) = 0 then
    raise exception '카테고리를 하나 이상 선택해야 합니다.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(p_category_ids) as requested(category_id)
    left join public.categories on categories.id = requested.category_id and categories.is_active = true
    where categories.id is null
  ) then
    raise exception '존재하지 않거나 비활성화된 카테고리가 포함되어 있습니다.' using errcode = '23503';
  end if;

  delete from public.tool_categories where tool_id = p_tool_id;

  insert into public.tool_categories (tool_id, category_id)
  select p_tool_id, category_id
  from (select distinct unnest(p_category_ids) as category_id) requested;
end;
$$;

revoke all on function public.set_tool_categories(uuid, uuid[]) from public;
grant execute on function public.set_tool_categories(uuid, uuid[]) to authenticated;

comment on function public.set_tool_categories(uuid, uuid[]) is
  'Atomically replaces a tool category assignment after server-side admin validation';
