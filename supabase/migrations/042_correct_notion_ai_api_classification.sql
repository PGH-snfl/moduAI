-- Notion exposes a workspace data API, not a public Notion AI inference API.
update public.tools
set
  has_api = false,
  api_url = null,
  updated_at = now()
where name = 'Notion AI'
  and url = 'https://www.notion.com/product/ai';
