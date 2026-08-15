-- Store search scope and feature importance so broad assistants can remain
-- discoverable without outranking purpose-built tools for task searches.

alter table public.tools
  add column if not exists tool_scope text not null default 'specialized',
  add column if not exists primary_features text[] not null default '{}'::text[],
  add column if not exists secondary_features text[] not null default '{}'::text[];

alter table public.tools drop constraint if exists tools_tool_scope_check;
alter table public.tools
  add constraint tools_tool_scope_check check (tool_scope in ('specialized', 'general'));

update public.tools
set tool_scope = 'general'
where lower(trim(name)) in (
  'chatgpt', 'claude', 'gemini', 'wrtn', '뤼튼', 'perplexity',
  'microsoft copilot', 'copilot', 'genspark'
)
or lower(name) like '%gemini%'
or lower(name) like '%뤼튼%'
or lower(name) like '%wrtn%';

update public.tools
set primary_features = coalesce(key_benefits, '{}'::text[])
where cardinality(primary_features) = 0 and cardinality(coalesce(key_benefits, '{}'::text[])) > 0;

comment on column public.tools.tool_scope is 'specialized: purpose-built tool, general: broad AI assistant';
comment on column public.tools.primary_features is 'Core capabilities used with the highest search relevance weight';
comment on column public.tools.secondary_features is 'Supporting capabilities used with a lower search relevance weight';
