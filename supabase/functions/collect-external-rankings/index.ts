import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = { 'Content-Type': 'application/json; charset=utf-8' }

function githubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return null
    const [owner, repo] = parsed.pathname.split('/').filter(Boolean)
    if (!owner || !repo) return null
    return { owner, repo: repo.replace(/\.git$/i, '') }
  } catch {
    return null
  }
}

function websiteDomain(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

function findVisits(value: unknown): number[] {
  if (Array.isArray(value)) return value.flatMap(findVisits)
  if (!value || typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  const own = typeof record.visits === 'number' ? [record.visits] : []
  return own.concat(Object.values(record).flatMap(findVisits))
}

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers })
  }

  const expected = Deno.env.get('RANKING_AUTOMATION_SECRET')
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || supplied !== expected) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ success: false, error: 'Missing server credentials' }), { status: 500, headers })
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: tools, error: toolsError } = await db
    .from('tools')
    .select('id,name,url,github_url,wikipedia_title')
  if (toolsError) return new Response(JSON.stringify({ success: false, error: toolsError.message }), { status: 500, headers })

  const token = Deno.env.get('GITHUB_TOKEN')
  const similarwebKey = Deno.env.get('SIMILARWEB_API_KEY')
  let collected = 0
  const failures: string[] = []

  for (const tool of tools ?? []) {
    try {
      const signal: Record<string, unknown> = {
        tool_id: tool.id,
        collected_at: new Date().toISOString(),
      }
      const domain = websiteDomain(tool.url)
      if (domain && similarwebKey) {
        const now = new Date()
        const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
        const month = previousMonth.toISOString().slice(0, 7)
        const endpoint = new URL(`https://api.similarweb.com/v1/website/${encodeURIComponent(domain)}/total-traffic-and-engagement/visits`)
        endpoint.search = new URLSearchParams({ api_key: similarwebKey, start_date: month, end_date: month, country: 'world', granularity: 'monthly', main_domain_only: 'false', format: 'json' }).toString()
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(20_000) })
        if (!response.ok) throw new Error(`Similarweb HTTP ${response.status}`)
        const visits = findVisits(await response.json())
        if (visits.length) {
          signal.website_monthly_visits = Math.round(visits.reduce((sum, count) => sum + count, 0))
          signal.website_traffic_provider = 'similarweb'
          signal.website_traffic_period = month
        }
      } else if (domain) {
        const response = await fetch(`https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(15_000) })
        if (!response.ok) throw new Error(`Tranco HTTP ${response.status}`)
        const data = await response.json()
        const latest = Array.isArray(data.ranks) ? data.ranks.find((entry: { rank?: number }) => Number.isFinite(entry.rank)) : null
        if (latest) {
          signal.website_traffic_rank = latest.rank
          signal.website_traffic_provider = 'tranco'
          signal.website_traffic_period = latest.date
        }
      }
      if (tool.github_url) {
        const repo = githubRepo(tool.github_url)
        if (!repo) throw new Error('invalid GitHub URL')
        const requestHeaders: Record<string, string> = {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ModuAI-RankingBot/1.0',
        }
        if (token) requestHeaders.Authorization = `Bearer ${token}`
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`, {
          headers: requestHeaders, signal: AbortSignal.timeout(15_000),
        })
        if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`)
        const data = await response.json()
        Object.assign(signal, {
          github_stars: data.stargazers_count ?? 0,
          github_forks: data.forks_count ?? 0,
          github_open_issues: data.open_issues_count ?? 0,
          github_pushed_at: data.pushed_at,
          source_url: data.html_url,
        })
      }
      if (tool.wikipedia_title) {
        const end = new Date(Date.now() - 86_400_000)
        const start = new Date(end.getTime() - 29 * 86_400_000)
        const day = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '')
        const title = encodeURIComponent(tool.wikipedia_title.replace(/ /g, '_'))
        const response = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/${title}/daily/${day(start)}/${day(end)}`, {
          headers: { 'User-Agent': 'ModuAI-RankingBot/1.0 (https://modu-ai.vercel.app)' },
          signal: AbortSignal.timeout(15_000),
        })
        if (!response.ok) throw new Error(`Wikimedia HTTP ${response.status}`)
        const data = await response.json()
        signal.wikipedia_views_30d = (data.items ?? []).reduce((sum: number, item: { views?: number }) => sum + (item.views ?? 0), 0)
        if (!signal.source_url) signal.source_url = `https://en.wikipedia.org/wiki/${title}`
      }
      const { error } = await db.from('external_signals').upsert(signal, { onConflict: 'tool_id' })
      if (error) throw error
      collected++
    } catch (error) {
      failures.push(`${tool.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const { error: refreshError } = await db.rpc('refresh_tool_ranking_scores')
  if (refreshError) failures.push(`ranking refresh: ${refreshError.message}`)

  return new Response(JSON.stringify({
    success: !refreshError,
    eligible: tools?.length ?? 0,
    collected,
    failures,
    timestamp: new Date().toISOString(),
  }), { status: refreshError ? 500 : 200, headers })
})
