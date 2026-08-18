import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const MIN_YOUTUBE_VIEWS = 10_000
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } })

type Paper = { title: string; summary: string; url: string; published: Date }
const topics = [
  { name: 'AI Agents', keywords: ['ai agent', 'agentic ai', 'autonomous agent', 'multi-agent', 'tool-using agent', 'llm agent'] },
  { name: 'Multimodal AI', keywords: ['multimodal ai', 'multimodal model', 'vision-language', 'vision language model'] },
  { name: 'Video Generation', keywords: ['video generation', 'text-to-video', 'image-to-video', 'generative video model'] },
  { name: 'Efficient LLM', keywords: ['llm quantization', 'language model distillation', 'efficient language model', 'small language model'] },
  { name: 'AI Reasoning', keywords: ['ai reasoning', 'language model reasoning', 'chain-of-thought', 'test-time compute'] },
  { name: 'RAG', keywords: ['retrieval-augmented generation', 'retrieval augmented generation', 'agentic rag', 'adaptive rag'] },
]

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
function tag(block: string, name: string) { return decodeXml(block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '') }
function parseArxiv(xml: string): Paper[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].flatMap(([, block]) => {
    const published = new Date(tag(block, 'published'))
    const title = tag(block, 'title')
    const summary = tag(block, 'summary')
    const url = tag(block, 'id')
    return title && summary && url && !Number.isNaN(published.getTime()) ? [{ title, summary, url, published }] : []
  })
}

async function collectArxiv(service: ReturnType<typeof createClient>) {
  const endpoint = 'https://export.arxiv.org/api/query?search_query=cat%3Acs.AI+OR+cat%3Acs.CL+OR+cat%3Acs.CV+OR+cat%3Acs.LG&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending'
  const response = await fetch(endpoint, { headers: { 'User-Agent': 'ModuAI-TrendCollector/1.0 admin@moduai.local' }, signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`arXiv HTTP ${response.status}`)
  const papers = parseArxiv(await response.text())
  const now = Date.now()
  let saved = 0
  for (const topic of topics) {
    const matches = papers.filter(paper => topic.keywords.some(keyword => `${paper.title} ${paper.summary}`.toLowerCase().includes(keyword)))
    const recent = matches.filter(paper => now - paper.published.getTime() <= 7 * 86_400_000)
    const previous = matches.filter(paper => {
      const age = now - paper.published.getTime()
      return age > 7 * 86_400_000 && age <= 14 * 86_400_000
    })
    if (matches.length === 0) continue
    const growth = previous.length === 0 ? (recent.length > 0 ? 100 : 0) : Math.round(((recent.length - previous.length) / previous.length) * 100)
    const sourceLabel = `arXiv 자동수집 · ${topic.name}`
    const { data: existing } = await service.from('ai_technology_trends').select('is_active').eq('source_label', sourceLabel).maybeSingle()
    const { error } = await service.from('ai_technology_trends').upsert({
      topic_name: topic.name,
      short_name: topic.name,
      summary: `최근 수집 논문 ${matches.length}편 중 ${recent.length}편이 최근 7일에 공개되었습니다. 관리자 검토 후 메인에 노출할 수 있습니다.`,
      source_label: sourceLabel,
      source_url: `https://arxiv.org/search/?query=${encodeURIComponent(topic.name)}&searchtype=all`,
      paper_count_7d: recent.length,
      previous_paper_count_7d: previous.length,
      growth_rate: growth,
      representative_papers: matches.slice(0, 5).map(paper => ({ title: paper.title, url: paper.url, published_at: paper.published.toISOString() })),
      calculated_at: new Date().toISOString(),
      is_active: existing?.is_active ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_label' })
    if (error) throw error
    saved += 1
  }
  return { found: papers.length, saved }
}

async function collectOpenAlex(service: ReturnType<typeof createClient>) {
  type OpenAlexWork = {
    id?: string; doi?: string; title?: string; publication_date?: string; type?: string; language?: string;
    cited_by_count?: number; is_retracted?: boolean; is_paratext?: boolean;
    abstract_inverted_index?: Record<string, number[]>;
    primary_topic?: { display_name?: string; subfield?: { display_name?: string }; field?: { display_name?: string }; domain?: { display_name?: string } };
    primary_location?: { landing_page_url?: string; source?: { display_name?: string; type?: string; is_in_doaj?: boolean } };
  }
  const abstractText = (index?: Record<string, number[]>) => {
    if (!index) return ''
    return Object.entries(index).flatMap(([word, positions]) => positions.map(position => ({ word, position }))).sort((a, b) => a.position - b.position).map(item => item.word).join(' ')
  }
  const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ').trim()
  const validate = (work: OpenAlexWork, topic: typeof topics[number]) => {
    const title = normalize(work.title)
    const abstract = normalize(abstractText(work.abstract_inverted_index))
    const topicText = normalize([work.primary_topic?.display_name, work.primary_topic?.subfield?.display_name, work.primary_topic?.field?.display_name, work.primary_topic?.domain?.display_name].filter(Boolean).join(' '))
    const titleMatches = topic.keywords.filter(keyword => title.includes(normalize(keyword)))
    const abstractMatches = topic.keywords.filter(keyword => abstract.includes(normalize(keyword)))
    const aiAnchor = /\b(ai|artificial intelligence|machine learning|deep learning|language model|llm|neural|generative)\b/.test(`${title} ${abstract} ${topicText}`)
    const scholarlyType = work.type === 'article' || work.type === 'preprint'
    const hasReliableIdentity = Boolean(work.doi || work.id)
    if (!work.title || work.is_retracted || work.is_paratext || !scholarlyType || !abstract || !hasReliableIdentity || !aiAnchor || (titleMatches.length === 0 && abstractMatches.length === 0)) return null
    let score = 35
    score += Math.min(30, titleMatches.length * 15)
    score += Math.min(15, abstractMatches.length * 5)
    if (/computer science|artificial intelligence|machine learning/.test(topicText)) score += 10
    if (work.doi) score += 5
    if (work.primary_location?.source?.display_name) score += 5
    if (work.primary_location?.source?.is_in_doaj) score += 5
    score = Math.min(100, score)
    return score >= 60 ? { work, score, matched_keywords: [...new Set([...titleMatches, ...abstractMatches])] } : null
  }
  const dedupe = (items: Array<NonNullable<ReturnType<typeof validate>>>) => {
    const seenDois = new Set<string>()
    const seenTitles = new Set<string>()
    return items.filter(item => {
      const doi = item.work.doi?.toLowerCase()
      const title = normalize(item.work.title)
      if (!title || (doi && seenDois.has(doi)) || seenTitles.has(title)) return false
      if (doi) seenDois.add(doi)
      seenTitles.add(title)
      return true
    })
  }
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10)
  const ranges = [{ from: iso(7), to: iso(0) }, { from: iso(14), to: iso(8) }]
  const requests = topics.flatMap(topic => ranges.map(async range => {
    const url = new URL('https://api.openalex.org/works')
    url.search = new URLSearchParams({ search: topic.keywords.join(' OR '), filter: `from_publication_date:${range.from},to_publication_date:${range.to},type:article|preprint,is_retracted:false,is_paratext:false,has_abstract:true`, sort: 'relevance_score:desc', 'per-page': '50', mailto: 'admin@moduai.local' }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (!response.ok) throw new Error(`OpenAlex HTTP ${response.status}`)
    const data = await response.json() as { results?: OpenAlexWork[] }
    const vetted = dedupe((data.results ?? []).map(work => validate(work, topic)).filter((item): item is NonNullable<typeof item> => Boolean(item))).sort((a, b) => b.score - a.score || (b.work.cited_by_count ?? 0) - (a.work.cited_by_count ?? 0))
    return { topic: topic.name, range, sampled: data.results?.length ?? 0, vetted }
  }))
  const responses = await Promise.all(requests)
  let saved = 0
  for (const topic of topics) {
    const recent = responses.find(result => result.topic === topic.name && result.range === ranges[0])
    const previous = responses.find(result => result.topic === topic.name && result.range === ranges[1])
    if (!recent || !previous) continue
    const recentCount = recent.vetted.length
    const previousCount = previous.vetted.length
    const growth = previousCount === 0 ? (recentCount > 0 ? 100 : 0) : Math.round(((recentCount - previousCount) / previousCount) * 100)
    const averageConfidence = recentCount === 0 ? 0 : Math.round(recent.vetted.reduce((sum, item) => sum + item.score, 0) / recentCount)
    const sourceLabel = `OpenAlex 자동수집 · ${topic.name}`
    const { data: existing } = await service.from('ai_technology_trends').select('is_active').eq('source_label', sourceLabel).maybeSingle()
    const { error } = await service.from('ai_technology_trends').upsert({
      topic_name: topic.name, short_name: topic.name,
      summary: `OpenAlex 상위 검색 후보 ${recent.sampled}편을 논문 유형·초록·철회 여부·AI 주제 일치도로 검증해 ${recentCount}편을 선별했습니다. 평균 신뢰도 ${averageConfidence}점입니다.`,
      source_label: sourceLabel,
      source_url: `https://openalex.org/works?page=1&filter=default.search:${encodeURIComponent(topic.name)}`,
      paper_count_7d: recentCount, previous_paper_count_7d: previousCount, growth_rate: growth,
      representative_papers: [...recent.vetted].sort((a, b) => (b.work.publication_date ?? '').localeCompare(a.work.publication_date ?? '') || b.score - a.score).slice(0, 10).map(({ work, score, matched_keywords }) => ({ title: work.title, url: work.primary_location?.landing_page_url ?? work.doi ?? work.id, published_at: work.publication_date, type: work.type, cited_by_count: work.cited_by_count ?? 0, source: work.primary_location?.source?.display_name ?? null, confidence_score: score, matched_keywords })),
      calculated_at: new Date().toISOString(), is_active: existing?.is_active ?? false, updated_at: new Date().toISOString(),
    }, { onConflict: 'source_label' })
    if (error) throw error
    saved += 1
  }
  return { found: responses.reduce((sum, result) => sum + result.sampled, 0), saved, methodology: '상위 50편 표본 검증: article/preprint, 초록 보유, 비철회, AI 주제 일치, 중복 제거, 신뢰도 60점 이상' }
}

async function collectYouTube(service: ReturnType<typeof createClient>, apiKey: string) {
  const after = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.search = new URLSearchParams({ part: 'snippet', type: 'video', order: 'viewCount', maxResults: '25', q: 'AI 도구|생성형 AI|인공지능 활용|챗GPT 사용법 -쇼츠 -shorts', publishedAfter: after, relevanceLanguage: 'ko', regionCode: 'KR', key: apiKey }).toString()
  const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(15_000) })
  if (!searchResponse.ok) throw new Error(`YouTube search HTTP ${searchResponse.status}`)
  const search = await searchResponse.json() as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } }; publishedAt?: string } }> }
  const ids = (search.items ?? []).map(item => item.id?.videoId).filter((id): id is string => Boolean(id))
  if (ids.length === 0) return { found: 0, saved: 0 }
  const { data: existingRows, error: existingError } = await service.from('featured_works').select('external_id,status,is_auto_managed').eq('platform', 'YouTube').in('external_id', ids)
  if (existingError) throw existingError
  const existingById = new Map((existingRows ?? []).map(row => [row.external_id, row]))
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  statsUrl.search = new URLSearchParams({ part: 'statistics,snippet,contentDetails', id: ids.join(','), key: apiKey }).toString()
  const statsResponse = await fetch(statsUrl, { signal: AbortSignal.timeout(15_000) })
  if (!statsResponse.ok) throw new Error(`YouTube videos HTTP ${statsResponse.status}`)
  const stats = await statsResponse.json() as { items?: Array<{ id: string; snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } }; publishedAt?: string }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }; contentDetails?: { duration?: string } }> }
  const durationSeconds = (duration = '') => {
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
    return match ? Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) : 0
  }
  const rejectionCounts: Record<string, number> = {}
  const reject = (reason: string) => { rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1 }
  const acceptedIds = new Set<string>()
  const rows = (stats.items ?? []).flatMap(item => {
    const snippet = item.snippet
    const title = snippet?.title?.trim() ?? ''
    const text = `${title} ${snippet?.description ?? ''}`
    const views = Number(item.statistics?.viewCount ?? 0)
    const seconds = durationSeconds(item.contentDetails?.duration)
    const hangulCount = (title.match(/[가-힣]/g) ?? []).length
    const hashtagCount = (title.match(/#/g) ?? []).length
    const symbolCount = (title.match(/[^\p{L}\p{N}\s.,?!:()[\]'"-]/gu) ?? []).length
    if (!title || !snippet?.channelTitle) { reject('정보 부족'); return [] }
    if (!/(\bai\b|artificial intelligence|생성형|인공지능|gpt|llm|챗GPT|머신러닝|딥러닝)/i.test(text)) { reject('AI 관련성 부족'); return [] }
    if (hangulCount < 4) { reject('한국어 제목 아님'); return [] }
    if (title.length < 10 || title.length > 110 || hashtagCount >= 3 || symbolCount >= 5 || /(?:wait\s*for\s*end|viral|무조건\s*보세요|꼭\s*보세요|알고리즘에\s*뜬|행운아|난리\s*난|충격|소름|대박|ㅋㅋ{2,}|([^\s])\1{4,})/iu.test(title)) { reject('제목 품질 미달'); return [] }
    if (views < MIN_YOUTUBE_VIEWS) { reject('조회수 1만 회 미달'); return [] }
    if (seconds < 180) { reject('쇼츠·짧은 영상'); return [] }
    const thumbnail = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url
    if (!thumbnail) { reject('썸네일 없음'); return [] }
    acceptedIds.add(item.id)
    const relevanceScore = Math.min(100, 70 + Math.min(15, hangulCount) + (views >= 10_000 ? 10 : views >= 3_000 ? 5 : 0))
    const existing = existingById.get(item.id)
    return [{
      platform: 'YouTube', external_id: item.id, title, creator_name: snippet.channelTitle,
      description: (snippet.description ?? '').slice(0, 300) || 'YouTube에서 자동 수집된 AI 관련 영상 후보입니다.',
      thumbnail_url: thumbnail, content_url: `https://www.youtube.com/watch?v=${item.id}`,
      view_count: views, like_count: Number(item.statistics?.likeCount ?? 0), comment_count: Number(item.statistics?.commentCount ?? 0),
      published_at: snippet.publishedAt ?? null, ai_relevance_score: relevanceScore, popularity_score: Math.log10(views + 1) * 10,
      status: existing?.status ?? 'draft', is_auto_managed: existing?.is_auto_managed ?? true,
      featured_from: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString(),
    }]
  })
  const rejectedIds = ids.filter(id => !acceptedIds.has(id))
  if (rejectedIds.length > 0) {
    const { error: rejectError } = await service.from('featured_works').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('platform', 'YouTube').eq('status', 'draft').eq('is_auto_managed', true).in('external_id', rejectedIds)
    if (rejectError) throw rejectError
  }
  if (rows.length === 0) return { found: ids.length, accepted: 0, rejected: rejectedIds.length, saved: 0, rejection_counts: rejectionCounts }
  const { data, error } = await service.from('featured_works').upsert(rows, { onConflict: 'platform,external_id' }).select('id')
  if (error) throw error
  return { found: ids.length, accepted: rows.length, rejected: rejectedIds.length, saved: data?.length ?? 0, rejection_counts: rejectionCounts }
}

async function rotateYouTubeContent(service: ReturnType<typeof createClient>) {
  const limit = 3
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: works, error } = await service.from('featured_works').select('id,title,status,view_count,published_at,is_auto_managed').eq('platform', 'YouTube').order('view_count', { ascending: false }).order('published_at', { ascending: false })
  if (error) throw error
  const manualApproved = (works ?? []).filter(work => !work.is_auto_managed && work.status === 'approved')
  const autoWorks = (works ?? []).filter(work => work.is_auto_managed)
  const eligibleAutoWorks = autoWorks.filter(work => work.status !== 'rejected' && (work.view_count ?? 0) >= MIN_YOUTUBE_VIEWS && Boolean(work.published_at) && work.published_at! >= cutoff)
  const selected = eligibleAutoWorks.slice(0, Math.max(0, limit - manualApproved.length))
  const selectedIds = new Set(selected.map(work => work.id))
  const previous = autoWorks.filter(work => work.status === 'approved')
  const promoted = selected.filter(work => work.status !== 'approved')
  const demoted = previous.filter(work => !selectedIds.has(work.id))

  if (previous.length > 0) {
    const { error: demoteError } = await service.from('featured_works').update({ status: 'draft', updated_at: new Date().toISOString() }).in('id', previous.map(work => work.id))
    if (demoteError) throw demoteError
  }
  if (selected.length > 0) {
    const { error: promoteError } = await service.from('featured_works').update({ status: 'approved', featured_from: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }).in('id', selected.map(work => work.id))
    if (promoteError) throw promoteError
  }
  if (promoted.length > 0 || demoted.length > 0) {
    const promotedNames = promoted.map(work => work.title).join(', ') || '없음'
    const demotedNames = demoted.map(work => work.title).join(', ') || '없음'
    await service.from('admin_notifications').insert({
      notification_type: 'youtube_auto_rotation',
      title: `YouTube 메인 콘텐츠 자동 교체 · ${promoted.length}개 신규 노출`,
      message: `신규 노출: ${promotedNames} / 노출 종료: ${demotedNames}`,
      metadata: { promoted: promoted.map(work => ({ id: work.id, title: work.title })), demoted: demoted.map(work => ({ id: work.id, title: work.title })), selected_count: selected.length, manual_approved_count: manualApproved.length },
    })
  }
  return { selected: selected.length, manual_approved: manualApproved.length, promoted: promoted.length, demoted: demoted.length, titles: selected.map(work => work.title) }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: '지원하지 않는 요청입니다.' })
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return json(500, { error: '서버 설정이 누락되었습니다.' })
  const authorization = req.headers.get('authorization') ?? ''
  const cronSecret = Deno.env.get('HOME_CONTENT_CRON_SECRET')
  const scheduled = Boolean(cronSecret) && req.headers.get('x-cron-secret') === cronSecret
  if (!scheduled) {
    const auth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const { data: { user } } = await auth.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') return json(403, { error: '관리자만 수집을 실행할 수 있습니다.' })
  }
  const service = createClient(supabaseUrl, serviceKey)
  const { data: run, error: runError } = await service.from('content_collection_runs').insert({ source: 'home-content', status: 'running' }).select('id').single()
  if (runError) return json(500, { error: '수집 기록을 시작하지 못했습니다.' })
  const details: Record<string, unknown> = {}
  const errors: string[] = []
  let found = 0
  let saved = 0
  try {
    try {
      const result = await collectArxiv(service); details.arxiv = result; found += result.found; saved += result.saved
    } catch (arxivError) {
      details.arxiv = { failed: true, reason: arxivError instanceof Error ? arxivError.message : 'arXiv 수집 실패' }
      errors.push(`arXiv 수집 실패: ${arxivError instanceof Error ? arxivError.message : '알 수 없는 오류'}`)
    }
    try {
      const result = await collectOpenAlex(service); details.openalex = result; found += result.found; saved += result.saved
    } catch (openAlexError) {
      details.openalex = { failed: true, reason: openAlexError instanceof Error ? openAlexError.message : 'OpenAlex 수집 실패' }
      errors.push(`OpenAlex 검증수집 실패: ${openAlexError instanceof Error ? openAlexError.message : '알 수 없는 오류'}`)
    }
    const youtubeKey = Deno.env.get('YOUTUBE_API_KEY')
    if (youtubeKey) {
      try { const result = await collectYouTube(service, youtubeKey); const rotation = await rotateYouTubeContent(service); details.youtube = { ...result, rotation }; found += result.found; saved += result.saved } catch (error) { errors.push(error instanceof Error ? error.message : 'YouTube 수집 실패') }
    } else details.youtube = { skipped: true, reason: 'YOUTUBE_API_KEY 미설정' }
    const status = errors.length === 0 ? 'success' : saved > 0 ? 'partial' : 'failed'
    const message = `후보 ${found}개를 확인하고 ${saved}개를 저장했습니다.${errors.length ? ` 오류: ${errors.join(', ')}` : ''}`
    await service.from('content_collection_runs').update({ status, items_found: found, items_saved: saved, details, message, completed_at: new Date().toISOString() }).eq('id', run.id)
    await service.from('admin_notifications').insert({ notification_type: 'content_collection', title: saved > 0 ? `새 메인 콘텐츠 후보 ${saved}개` : '메인 콘텐츠 자동수집 완료', message, metadata: { run_id: run.id, found, saved, status } })
    return json(200, { status, found, saved, details, errors })
  } catch (error) {
    const message = error instanceof Error ? error.message : '자동수집 실패'
    await service.from('content_collection_runs').update({ status: 'failed', message, completed_at: new Date().toISOString() }).eq('id', run.id)
    return json(500, { error: message })
  }
})
