import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' }
const MAX_ITEMS_PER_FEED = 8

const RSS_FEEDS = [
  { url: 'https://news.google.com/rss/search?q=%EC%83%9D%EC%84%B1%ED%98%95+AI+OR+AI+%EB%8F%84%EA%B5%AC&hl=ko&gl=KR&ceid=KR:ko', source: 'Google News Korea', category: 'domestic' as const },
  { url: 'https://news.google.com/rss/search?q=AI+%EC%8A%A4%ED%83%80%ED%8A%B8%EC%97%85+OR+AI+%EC%97%85%EB%8D%B0%EC%9D%B4%ED%8A%B8&hl=ko&gl=KR&ceid=KR:ko', source: 'Google News Korea', category: 'domestic' as const },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', category: 'global' as const },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', source: 'Wired AI', category: 'global' as const },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge AI', category: 'global' as const },
]

type FeedItem = { title: string; link: string; pubDate: string; description: string }
type NewsRow = {
  title: string
  source: string
  url: string
  published_date: string
  badge: string | null
  category: 'domestic' | 'global'
  summary: string | null
}

function decodeXml(value: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  }
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, match => entities[match] ?? match)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagValue(xml: string, names: string[]): string {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))
    if (match) return decodeXml(match[1])
  }
  return ''
}

function parseFeed(xml: string): FeedItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)]
  return blocks.flatMap(([, , block]) => {
    const title = tagValue(block, ['title'])
    const rssLink = tagValue(block, ['link'])
    const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ?? ''
    const link = decodeXml(rssLink || atomLink)
    if (!title || !link) return []
    return [{
      title,
      link,
      pubDate: tagValue(block, ['pubDate', 'published', 'updated', 'dc:date']) || new Date().toISOString(),
      description: tagValue(block, ['description', 'summary', 'content:encoded', 'content']),
    }]
  })
}

function normalizeUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key)
    }
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(safeDate).replace(/-/g, '.')
}

function isAIRelated(text: string): boolean {
  return /(^|\W)(ai|agi|llm|gpt|chatgpt|openai|anthropic|claude|gemini|copilot|llama)(\W|$)|인공지능|생성형|머신러닝|딥러닝|챗봇|클로드|제미나이|코파일럿/i.test(text)
}

function fallbackSummary(description: string): string | null {
  if (!description) return null
  const clean = description.replace(/\s+/g, ' ').trim()
  return clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean
}

function responseOutputText(data: Record<string, unknown>): string | null {
  const output = Array.isArray(data.output) ? data.output : []
  for (const item of output) {
    if (!item || typeof item !== 'object' || !Array.isArray((item as { content?: unknown }).content)) continue
    for (const content of (item as { content: Array<Record<string, unknown>> }).content) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text.trim()
    }
  }
  return null
}

async function generateSummary(item: FeedItem, apiKey?: string): Promise<string | null> {
  const sourceText = `${item.title}\n${item.description}`.trim()
  if (!apiKey) return fallbackSummary(item.description)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_SUMMARY_MODEL') ?? 'gpt-5.4-nano',
        instructions: 'AI 뉴스 내용을 사실을 추가하지 말고 원문의 언어로 한 문장, 120자 이내로 요약하세요.',
        input: sourceText,
        max_output_tokens: 120,
      }),
    })
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`)
    return responseOutputText(await response.json()) ?? fallbackSummary(item.description)
  } catch (error) {
    console.error('Summary generation failed:', error)
    return fallbackSummary(item.description)
  }
}

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  }

  const expectedSecret = Deno.env.get('CRAWL_NEWS_SECRET')
  const suppliedSecret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: jsonHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase credentials')

    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let saved = 0
    let skipped = 0
    const errors: string[] = []

    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(feed.url, {
          headers: { 'User-Agent': 'ModuAI-NewsBot/1.0 (+https://modu-ai.vercel.app)' },
          signal: AbortSignal.timeout(15_000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const parsedItems = parseFeed(await response.text())
        const matchingItems = parsedItems.filter(item => isAIRelated(`${item.title} ${item.description}`))
        const candidates = matchingItems.slice(0, MAX_ITEMS_PER_FEED)
        skipped += parsedItems.length - matchingItems.length

        const rows: NewsRow[] = []
        for (const [index, item] of candidates.entries()) {
          const url = normalizeUrl(item.link)
          if (!url) { skipped++; continue }
          rows.push({
            title: item.title,
            source: feed.source,
            url,
            published_date: formatDate(item.pubDate),
            badge: index === 0 ? 'New' : null,
            category: feed.category,
            summary: await generateSummary(item, openaiKey),
          })
        }

        if (rows.length) {
          const { error } = await db.from('news').upsert(rows, { onConflict: 'url' })
          if (error) throw error
          saved += rows.length
        }
      } catch (error) {
        const message = `${feed.source}: ${error instanceof Error ? error.message : String(error)}`
        console.error(message)
        errors.push(message)
      }
    }

    const status = errors.length === RSS_FEEDS.length ? 502 : 200
    return new Response(JSON.stringify({
      success: status === 200,
      saved,
      skipped,
      sourcesSucceeded: RSS_FEEDS.length - errors.length,
      sourcesFailed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    }), { status, headers: jsonHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
