import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Content-Type': 'application/json; charset=utf-8',
}
const ALLOWED_FIELDS = new Set([
  'pricing_type', 'pricing_start_at', 'pricing_summary', 'pricing_details', 'pricing_currency', 'pricing_url',
  'has_api', 'api_url', 'korean_support_level', 'primary_features', 'secondary_features', 'key_benefits', 'limitations',
])
const KOREAN_REQUIRED_FIELDS = new Set(['pricing_summary', 'pricing_details', 'primary_features', 'secondary_features', 'key_benefits', 'limitations'])

type ToolRow = Record<string, unknown> & { id: string; name: string; url: string | null; pricing_url: string | null }
type Analysis = {
  has_changes: boolean
  change_summary: string
  confidence: number
  proposed_updates: Record<string, unknown>
  evidence: Array<{ field: string; quote: string }>
}

function stripHtml(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/\s+/g, ' ').trim()
}

function pageTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null
}

function outputText(data: Record<string, unknown>) {
  const output = Array.isArray(data.output) ? data.output : []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === 'object' && (part as { type?: string }).type === 'output_text') {
        return String((part as { text?: unknown }).text ?? '')
      }
    }
  }
  throw new Error('No structured output returned')
}

function containsKorean(value: unknown) {
  return /[가-힣]/.test(Array.isArray(value) ? value.join(' ') : String(value ?? ''))
}

function sanitizeUpdates(updates: Record<string, unknown>, current: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(updates).filter(([field, value]) => {
    if (!ALLOWED_FIELDS.has(field) || value === null || JSON.stringify(value) === JSON.stringify(current[field])) return false
    if (KOREAN_REQUIRED_FIELDS.has(field) && !containsKorean(value)) return false
    return true
  }))
}

async function analyze(openaiKey: string, tool: ToolRow, sourceUrl: string, text: string): Promise<Analysis> {
  const current = Object.fromEntries([...ALLOWED_FIELDS].map(field => [field, tool[field] ?? null]))
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_TOOL_REFRESH_MODEL') ?? 'gpt-5.4-nano',
      store: false,
      instructions: [
        'You compare an AI product official webpage with its current catalog record.',
        'Return only changes explicitly supported by the supplied page text. Never infer a price, feature, API, language, or availability.',
        'Ignore temporary coupons and personalized checkout prices. Preserve currency and billing cadence in pricing_summary.',
        'Every changed field needs a short verbatim evidence quote from the page. If evidence is ambiguous, return no change.',
        'All user-facing proposed values must be written in natural Korean even when the source page is English. Product and plan names may remain in their official spelling.',
        'Keep verbatim evidence quotes in the source language; evidence is for administrators and is never published directly.',
        'Only use the allowed field names supplied in the schema.',
      ].join(' '),
      input: `Tool: ${tool.name}\nOfficial source: ${sourceUrl}\nCurrent record: ${JSON.stringify(current)}\n\nOfficial page text:\n${text.slice(0, 30000)}`,
      text: { format: {
        type: 'json_schema', name: 'tool_information_changes', strict: true,
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            has_changes: { type: 'boolean' },
            change_summary: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            proposed_updates: {
              type: 'object', additionalProperties: false,
              properties: {
                pricing_type: { type: ['string', 'null'], enum: ['Free', 'Freemium', 'Paid', 'Contact', null] }, pricing_start_at: { type: ['string', 'null'] },
                pricing_summary: { type: ['string', 'null'] }, pricing_details: { type: ['array', 'null'], items: { type: 'string' } },
                pricing_currency: { type: ['string', 'null'] }, pricing_url: { type: ['string', 'null'] },
                has_api: { type: ['boolean', 'null'] }, api_url: { type: ['string', 'null'] },
                korean_support_level: { type: ['string', 'null'], enum: ['None', 'UI only', 'Full Support', null] },
                primary_features: { type: ['array', 'null'], items: { type: 'string' } },
                secondary_features: { type: ['array', 'null'], items: { type: 'string' } },
                key_benefits: { type: ['array', 'null'], items: { type: 'string' } },
                limitations: { type: ['array', 'null'], items: { type: 'string' } },
              },
              required: [...ALLOWED_FIELDS],
            },
            evidence: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { field: { type: 'string' }, quote: { type: 'string' } }, required: ['field', 'quote'] } },
          }, required: ['has_changes', 'change_summary', 'confidence', 'proposed_updates', 'evidence'],
        },
      } },
      max_output_tokens: 2200,
    }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`)
  const parsed = JSON.parse(outputText(await response.json())) as Analysis
  parsed.proposed_updates = sanitizeUpdates(parsed.proposed_updates, current)
  parsed.evidence = parsed.evidence.filter(item => ALLOWED_FIELDS.has(item.field) && item.quote.trim().length >= 3)
  parsed.has_changes = parsed.has_changes && Object.keys(parsed.proposed_updates).length > 0 && parsed.evidence.length > 0
  return parsed
}

function priceTokens(value: unknown) {
  return String(value ?? '').match(/(?:US\$|USD\s*|\$|₩|KRW\s*|€|£)\s?[\d,.]+/gi)?.map(token => token.replace(/\s+/g, '').toLowerCase()) ?? []
}

function analyzeWithoutModel(tool: ToolRow, sourceUrl: string, text: string): Analysis {
  const currentText = [tool.pricing_start_at, tool.pricing_summary, ...(Array.isArray(tool.pricing_details) ? tool.pricing_details : [])].join(' ')
  const currentPrices = new Set(priceTokens(currentText))
  const fragments = text.split(/(?<=[.!?])\s+|\s{2,}/).map(value => value.trim()).filter(value => value.length >= 8 && value.length <= 240)
  const windows = [...text.matchAll(/(?:US\$|USD\s*|\$|₩|KRW\s*|€|£)\s?[\d,.]+/gi)].map(match => text.slice(Math.max(0, (match.index ?? 0) - 70), Math.min(text.length, (match.index ?? 0) + match[0].length + 100)).trim())
  const priceEvidence = [...fragments, ...windows].filter(value => priceTokens(value).length > 0).filter(value => /month|year|annual|monthly|per\s+month|\/mo|\/yr|월|년|연간|매월|무료|free/i.test(value))
  const unique = [...new Map(priceEvidence.map(value => [value.toLowerCase(), value])).values()].slice(0, 5)
  const pagePrices = new Set(unique.flatMap(priceTokens))
  const oldPriceMissing = [...currentPrices].some(price => !pagePrices.has(price))
  if (!oldPriceMissing || unique.length === 0) return { has_changes: false, change_summary: '', confidence: 0, proposed_updates: {}, evidence: [] }

  const firstPrice = priceTokens(unique[0])[0]
  const hasFree = unique.some(value => /\bfree\b|무료/i.test(value))
  return {
    has_changes: true,
    change_summary: '공식 가격 페이지에서 현재 저장된 금액을 찾지 못했고 다른 요금 표기를 확인했습니다. 관리자 확인이 필요합니다.',
    confidence: 0.76,
    proposed_updates: {
      pricing_type: hasFree ? 'Freemium' : 'Paid',
      pricing_start_at: firstPrice ? firstPrice.replace(/^us/i, '').toUpperCase() : tool.pricing_start_at,
      pricing_currency: unique.some(value => /₩|KRW/i.test(value)) ? 'KRW' : unique.some(value => /\$|USD/i.test(value)) ? 'USD' : tool.pricing_currency,
      pricing_url: sourceUrl,
    },
    evidence: unique.slice(0, 3).map(quote => ({ field: 'pricing_start_at', quote })),
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ success: false, error: 'Missing server configuration' }), { status: 500, headers })
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const suppliedToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const cronSecret = Deno.env.get('TOOL_REFRESH_CRON_SECRET')
  const isScheduled = Boolean(cronSecret) && req.headers.get('x-cron-secret') === cronSecret
  let isAdmin = false
  if (!isScheduled) {
    if (suppliedToken) {
      const { data } = await db.auth.getUser(suppliedToken)
      isAdmin = data.user?.app_metadata?.role === 'admin'
    }
  }
  if (!isScheduled && !isAdmin) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers })

  const body = await req.json().catch(() => ({})) as { limit?: number; tool_id?: string; trigger_type?: string }
  const limit = Math.max(1, Math.min(Number(body.limit) || 20, 50))
  const triggerType = isScheduled ? 'scheduled' : 'manual'
  const { data: run, error: runError } = await db.from('tool_update_runs').insert({ trigger_type: triggerType }).select('id').single()
  if (runError) return new Response(JSON.stringify({ success: false, error: runError.message }), { status: 500, headers })

  let query = db.from('tools').select('*').eq('update_check_enabled', true)
    .or(`update_last_checked_at.is.null,update_last_checked_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`)
    .order('update_last_checked_at', { ascending: true, nullsFirst: true }).limit(limit)
  if (body.tool_id) query = query.eq('id', body.tool_id)
  const { data: tools, error: toolsError } = await query
  const errors: string[] = []
  let checked = 0
  let created = 0

  if (toolsError) errors.push(toolsError.message)
  for (const raw of tools ?? []) {
    const tool = raw as ToolRow
    const sourceUrl = tool.pricing_url || tool.url
    if (!sourceUrl) { errors.push(`${tool.name}: source URL missing`); continue }
    try {
      const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'ModuAI-InformationMonitor/1.0 (+https://modu-ai.vercel.app)' }, redirect: 'follow', signal: AbortSignal.timeout(25_000) })
      if (!response.ok) throw new Error(`official page HTTP ${response.status}`)
      const html = await response.text()
      const text = stripHtml(html)
      if (text.length < 200) throw new Error('official page text was unavailable')
      const result = openaiKey ? await analyze(openaiKey, tool, response.url, text) : analyzeWithoutModel(tool, response.url, text)
      checked++
      await db.from('tools').update({ update_last_checked_at: new Date().toISOString(), update_check_error: null }).eq('id', tool.id)
      if (!result.has_changes || result.confidence < 0.72) continue

      const currentValues = Object.fromEntries(Object.keys(result.proposed_updates).map(field => [field, tool[field] ?? null]))
      const candidatePayload = {
        run_id: run.id, tool_id: tool.id, status: 'pending', source_url: response.url, source_title: pageTitle(html),
        current_values: currentValues, proposed_updates: result.proposed_updates, change_summary: result.change_summary,
        evidence: result.evidence, confidence: result.confidence, detected_at: new Date().toISOString(),
      }
      const { data: pending } = await db.from('tool_update_candidates').select('id').eq('tool_id', tool.id).eq('status', 'pending').maybeSingle()
      const candidateResult = pending
        ? await db.from('tool_update_candidates').update(candidatePayload).eq('id', pending.id)
        : await db.from('tool_update_candidates').insert(candidatePayload)
      const candidateError = candidateResult.error
      if (candidateError) throw candidateError
      created++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${tool.name}: ${message}`)
      await db.from('tools').update({ update_last_checked_at: new Date().toISOString(), update_check_error: message.slice(0, 500) }).eq('id', tool.id)
    }
  }

  const status = errors.length ? (checked ? 'partial' : 'failed') : 'success'
  await db.from('tool_update_runs').update({ status, tools_checked: checked, candidates_created: created, errors, completed_at: new Date().toISOString() }).eq('id', run.id)
  if (created > 0) {
    const { count: pendingCount } = await db.from('tool_update_candidates').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const notification = {
      notification_type: 'tool_information_update', title: `도구 정보 변경 후보 ${pendingCount ?? created}건`,
      message: `공식 페이지 전체 순회에서 관리자 검토가 필요한 변경 후보가 발견됐습니다.`,
      metadata: { run_id: run.id, target_path: '/admin/tool-updates', pending_count: pendingCount ?? created }, is_read: false,
    }
    const { data: existing } = await db.from('admin_notifications').select('id').eq('notification_type', 'tool_information_update').eq('is_read', false).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (existing) await db.from('admin_notifications').update(notification).eq('id', existing.id)
    else await db.from('admin_notifications').insert(notification)
  }

  return new Response(JSON.stringify({ success: status !== 'failed', run_id: run.id, status, checked, candidates_created: created, errors }), { status: status === 'failed' ? 500 : 200, headers })
})
