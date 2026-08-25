import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } })
const KEYWORDS = ['인공지능', '생성형 ai', '생성 ai', 'ai 도구', 'ai 에이전트', '챗gpt', 'chatgpt', 'openai', '클로드', 'claude', '제미나이', 'gemini', 'llm', '멀티모달', '머신러닝']
const SEARCH_QUERIES = ['생성형 AI', 'AI 도구', 'AI 에이전트', '챗GPT']
type Row = { platform: 'youtube' | 'instagram' | 'threads'; external_id: string; title: string; body: string | null; creator_name: string | null; content_url: string; media_url: string | null; published_at: string | null; view_count: number | null; like_count: number | null; comment_count: number | null; ai_relevance_score: number; matched_keywords: string[]; language: string; raw_data: Record<string, unknown>; updated_at: string }

function relevance(text: string) {
  const lower = text.toLocaleLowerCase('ko-KR')
  const matched = KEYWORDS.filter(keyword => lower.includes(keyword))
  const hangul = (text.match(/[가-힣]/g) ?? []).length
  return { matched, score: Math.min(100, 45 + matched.length * 12 + Math.min(20, hangul)), language: hangul >= 4 ? 'ko' : 'other' }
}
function clean(value: string | undefined | null, max = 500) { return (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) }
async function save(db: ReturnType<typeof createClient>, rows: Row[]) {
  if (!rows.length) return 0
  const { data: locked, error: lockedError } = await db.from('social_content_candidates').select('platform,external_id').in('external_id', rows.map(row => row.external_id)).in('status', ['approved', 'rejected'])
  if (lockedError) throw lockedError
  const keys = new Set((locked ?? []).map(row => `${row.platform}:${row.external_id}`))
  const writable = rows.filter(row => !keys.has(`${row.platform}:${row.external_id}`))
  if (!writable.length) return 0
  const { data, error } = await db.from('social_content_candidates').upsert(writable, { onConflict: 'platform,external_id' }).select('id')
  if (error) throw error
  return data?.length ?? 0
}

async function collectYouTube(db: ReturnType<typeof createClient>, key: string) {
  const after = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const found = new Map<string, Record<string, unknown>>()
  for (const query of SEARCH_QUERIES) {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.search = new URLSearchParams({ part: 'snippet', type: 'video', order: 'date', maxResults: '25', q: query, publishedAfter: after, relevanceLanguage: 'ko', regionCode: 'KR', key }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`YouTube search HTTP ${response.status}`)
    const data = await response.json() as { items?: Array<Record<string, unknown>> }
    for (const item of data.items ?? []) { const id = (item.id as { videoId?: string } | undefined)?.videoId; if (id) found.set(id, item) }
  }
  const ids = [...found.keys()]
  if (!ids.length) return { found: 0, saved: 0 }
  const rows: Row[] = []
  for (let offset = 0; offset < ids.length; offset += 50) {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.search = new URLSearchParams({ part: 'snippet,statistics', id: ids.slice(offset, offset + 50).join(','), key }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`YouTube videos HTTP ${response.status}`)
    const data = await response.json() as { items?: Array<Record<string, unknown>> }
    for (const item of data.items ?? []) {
      const snippet = item.snippet as Record<string, unknown> | undefined; const stats = item.statistics as Record<string, string> | undefined
      const title = clean(snippet?.title as string, 240); const body = clean(snippet?.description as string)
      const ai = relevance(`${title} ${body}`); if (!title || !ai.matched.length || ai.language !== 'ko') continue
      const thumbnails = snippet?.thumbnails as { high?: { url?: string }; medium?: { url?: string } } | undefined
      rows.push({ platform: 'youtube', external_id: String(item.id), title, body: body || null, creator_name: clean(snippet?.channelTitle as string, 160) || null, content_url: `https://www.youtube.com/watch?v=${item.id}`, media_url: thumbnails?.high?.url ?? thumbnails?.medium?.url ?? null, published_at: (snippet?.publishedAt as string) ?? null, view_count: Number(stats?.viewCount ?? 0), like_count: Number(stats?.likeCount ?? 0), comment_count: Number(stats?.commentCount ?? 0), ai_relevance_score: ai.score, matched_keywords: ai.matched, language: ai.language, raw_data: item, updated_at: new Date().toISOString() })
    }
  }
  return { found: ids.length, saved: await save(db, rows), accepted: rows.length }
}

async function collectThreads(db: ReturnType<typeof createClient>, token: string) {
  const rows: Row[] = []; let found = 0
  for (const query of SEARCH_QUERIES) {
    const url = new URL('https://graph.threads.net/keyword_search')
    url.search = new URLSearchParams({ q: query, search_type: 'RECENT', fields: 'id,text,username,permalink,timestamp,media_type,media_url,thumbnail_url', access_token: token }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) }); if (!response.ok) throw new Error(`Threads HTTP ${response.status}: ${clean(await response.text(), 200)}`)
    const data = await response.json() as { data?: Array<Record<string, unknown>> }; found += data.data?.length ?? 0
    for (const item of data.data ?? []) { const text = clean(item.text as string); const ai = relevance(text); if (!text || !ai.matched.length || ai.language !== 'ko') continue; rows.push({ platform: 'threads', external_id: String(item.id), title: text.slice(0, 120), body: text, creator_name: clean(item.username as string, 160) || null, content_url: String(item.permalink), media_url: (item.thumbnail_url ?? item.media_url ?? null) as string | null, published_at: (item.timestamp as string) ?? null, view_count: null, like_count: null, comment_count: null, ai_relevance_score: ai.score, matched_keywords: ai.matched, language: ai.language, raw_data: item, updated_at: new Date().toISOString() }) }
  }
  const unique = [...new Map(rows.map(row => [row.external_id, row])).values()]
  return { found, accepted: unique.length, saved: await save(db, unique) }
}

async function collectInstagram(db: ReturnType<typeof createClient>, token: string, userId: string, version: string) {
  const rows: Row[] = []; let found = 0
  for (const hashtag of ['인공지능', '생성형AI', 'AI도구', '챗GPT']) {
    const lookup = new URL(`https://graph.facebook.com/${version}/ig_hashtag_search`); lookup.search = new URLSearchParams({ user_id: userId, q: hashtag, access_token: token }).toString()
    const lookupResponse = await fetch(lookup, { signal: AbortSignal.timeout(15_000) }); if (!lookupResponse.ok) throw new Error(`Instagram hashtag HTTP ${lookupResponse.status}: ${clean(await lookupResponse.text(), 200)}`)
    const lookupData = await lookupResponse.json() as { data?: Array<{ id: string }> }; const hashtagId = lookupData.data?.[0]?.id; if (!hashtagId) continue
    const media = new URL(`https://graph.facebook.com/${version}/${hashtagId}/recent_media`); media.search = new URLSearchParams({ user_id: userId, fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count', limit: '25', access_token: token }).toString()
    const mediaResponse = await fetch(media, { signal: AbortSignal.timeout(15_000) }); if (!mediaResponse.ok) throw new Error(`Instagram media HTTP ${mediaResponse.status}: ${clean(await mediaResponse.text(), 200)}`)
    const data = await mediaResponse.json() as { data?: Array<Record<string, unknown>> }; found += data.data?.length ?? 0
    for (const item of data.data ?? []) { const caption = clean(item.caption as string); const ai = relevance(caption); if (!caption || !ai.matched.length || ai.language !== 'ko') continue; rows.push({ platform: 'instagram', external_id: String(item.id), title: caption.slice(0, 120), body: caption, creator_name: clean(item.username as string, 160) || null, content_url: String(item.permalink), media_url: (item.thumbnail_url ?? item.media_url ?? null) as string | null, published_at: (item.timestamp as string) ?? null, view_count: null, like_count: Number(item.like_count ?? 0), comment_count: Number(item.comments_count ?? 0), ai_relevance_score: ai.score, matched_keywords: ai.matched, language: ai.language, raw_data: item, updated_at: new Date().toISOString() }) }
  }
  const unique = [...new Map(rows.map(row => [row.external_id, row])).values()]
  return { found, accepted: unique.length, saved: await save(db, unique) }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return respond(405, { error: '지원하지 않는 요청입니다.' })
  const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !serviceKey) return respond(500, { error: '서버 설정이 누락되었습니다.' })
  const scheduled = Boolean(Deno.env.get('HOME_CONTENT_CRON_SECRET')) && req.headers.get('x-cron-secret') === Deno.env.get('HOME_CONTENT_CRON_SECRET')
  if (!scheduled) { const auth = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('authorization') ?? '' } } }); const { data: { user } } = await auth.auth.getUser(); if (!user || user.app_metadata?.role !== 'admin') return respond(403, { error: '관리자만 실행할 수 있습니다.' }) }
  const db = createClient(url, serviceKey); const { data: run, error: runError } = await db.from('social_collection_runs').insert({ status: 'running' }).select('id').single(); if (runError) return respond(500, { error: runError.message })
  const details: Record<string, unknown> = {}; const errors: string[] = []; let found = 0; let saved = 0
  const execute = async (name: string, task: (() => Promise<{ found: number; saved: number }>) | null, reason: string) => { if (!task) { details[name] = { skipped: true, reason }; return } try { const result = await task(); details[name] = result; found += result.found; saved += result.saved } catch (error) { const message = error instanceof Error ? error.message : String(error); details[name] = { failed: true, reason: message }; errors.push(`${name}: ${message}`) } }
  await execute('youtube', Deno.env.get('YOUTUBE_API_KEY') ? () => collectYouTube(db, Deno.env.get('YOUTUBE_API_KEY')!) : null, 'YOUTUBE_API_KEY 미설정')
  await execute('threads', Deno.env.get('THREADS_ACCESS_TOKEN') ? () => collectThreads(db, Deno.env.get('THREADS_ACCESS_TOKEN')!) : null, 'THREADS_ACCESS_TOKEN 미설정')
  await execute('instagram', Deno.env.get('INSTAGRAM_ACCESS_TOKEN') && Deno.env.get('INSTAGRAM_USER_ID') ? () => collectInstagram(db, Deno.env.get('INSTAGRAM_ACCESS_TOKEN')!, Deno.env.get('INSTAGRAM_USER_ID')!, Deno.env.get('META_GRAPH_VERSION') ?? 'v25.0') : null, 'INSTAGRAM_ACCESS_TOKEN 또는 INSTAGRAM_USER_ID 미설정')
  const status = errors.length ? (saved ? 'partial' : 'failed') : 'success'; const message = `AI 소셜 후보 ${found}개를 확인해 ${saved}개를 검토 대기열에 저장했습니다.${errors.length ? ` 오류 ${errors.length}건` : ''}`
  await db.from('social_collection_runs').update({ status, items_found: found, items_saved: saved, details, message, completed_at: new Date().toISOString() }).eq('id', run.id)
  await db.from('admin_notifications').insert({ notification_type: 'social_content_collection', title: saved ? `새 AI 소셜 게시물 ${saved}개` : 'AI 소셜 자동수집 완료', message, metadata: { target_path: '/admin/social-content', run_id: run.id, status, found, saved } })
  return respond(200, { status, found, saved, details, errors })
})
