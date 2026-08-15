import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: Record<string, unknown>) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } },
)

const blockedHosts = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal'])
const blockedTlds = ['.local', '.internal', '.localhost', '.home', '.lan']
const trackingParams = new Set(['ref', 'referrer', 'affiliate', 'aff', 'source'])
const shortenerHosts = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'is.gd',
  'cutt.ly', 'rebrand.ly', 'shorturl.at', 'han.gl', 'vo.la', 'me2.do',
])
const blockedDownloadExtensions = /\.(?:exe|msi|dmg|pkg|apk|zip|rar|7z|tar|gz|iso)(?:$|[?#])/i

function isPrivateIp(value: string) {
  const ip = value.replace(/^\[|\]$/g, '').toLowerCase()
  if (/^127\./.test(ip) || /^10\./.test(ip) || /^192\.168\./.test(ip) || /^169\.254\./.test(ip)) return true
  const second = Number(ip.split('.')[1])
  if (ip.startsWith('172.') && second >= 16 && second <= 31) return true
  if (ip === '0.0.0.0' || ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true
  return false
}

function normalizeUrl(raw: string) {
  const candidate = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP 또는 HTTPS 주소만 등록할 수 있습니다.')
  url.username = ''
  url.password = ''
  url.hash = ''
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (shortenerHosts.has(url.hostname)) throw new Error('URL 단축 주소 대신 공식 웹사이트 주소를 입력해주세요.')
  if (blockedDownloadExtensions.test(url.pathname)) throw new Error('파일 다운로드 주소 대신 공식 웹사이트 주소를 입력해주세요.')
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || trackingParams.has(key.toLowerCase())) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
  const normalized = url.toString().replace(/\/$/, '')
  const parts = url.hostname.split('.')
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : url.hostname
  return { url, normalized, rootDomain }
}

async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase()
  if (blockedHosts.has(host) || blockedTlds.some((suffix) => host.endsWith(suffix)) || isPrivateIp(host)) {
    throw new Error('내부 네트워크 주소는 등록할 수 없습니다.')
  }
  for (const type of ['A', 'AAAA'] as const) {
    try {
      const addresses = await Deno.resolveDns(host, type)
      if (addresses.some(isPrivateIp)) throw new Error('내부 네트워크로 연결되는 주소는 등록할 수 없습니다.')
    } catch (error) {
      if (error instanceof Error && error.message.includes('내부 네트워크')) throw error
      // A host may legitimately have only A or only AAAA records.
    }
  }
}

async function fetchOfficialPage(initial: URL) {
  let current = initial
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    await assertPublicHost(current.hostname)
    const response = await fetch(current, {
      redirect: 'manual',
      headers: { 'User-Agent': 'ModuAI-SubmissionVerifier/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw new Error('잘못된 리디렉션 응답입니다.')
      current = new URL(location, current)
      continue
    }
    if (!response.ok) throw new Error(`공식 사이트가 HTTP ${response.status}로 응답했습니다.`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) throw new Error('웹사이트 HTML 주소를 입력해주세요.')
    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength > 1_500_000) throw new Error('검증하기에 페이지 크기가 너무 큽니다.')
    const text = (await response.text()).slice(0, 1_500_000)
    return { response, html: text, finalUrl: current }
  }
  throw new Error('리디렉션이 너무 많습니다.')
}

async function domainSignals(rootDomain: string) {
  const signals: string[] = []
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, {
      headers: { 'User-Agent': 'ModuAI-SubmissionVerifier/1.0' },
      signal: AbortSignal.timeout(3500),
    })
    if (response.ok) {
      const data = await response.json() as { events?: Array<{ eventAction?: string; eventDate?: string }> }
      const registration = data.events?.find((event) => event.eventAction === 'registration')?.eventDate
      if (registration) {
        const ageDays = Math.floor((Date.now() - new Date(registration).getTime()) / 86_400_000)
        if (ageDays >= 0 && ageDays < 30) signals.push(`도메인 등록 후 ${ageDays}일밖에 지나지 않았습니다.`)
      }
    }
  } catch { /* Domain age is a supporting signal, not a hard requirement. */ }

  try {
    const results = await Deno.resolveDns(`${rootDomain}.dbl.spamhaus.org`, 'A')
    if (results.some((address) => address.startsWith('127.0.1.'))) signals.push('공개 도메인 평판 목록에서 위험 신호가 감지되었습니다.')
  } catch { /* NXDOMAIN means there is no listing. */ }
  return signals
}

function cleanText(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim()
}

function metaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return cleanText(match[1])
  }
  return ''
}

type CheckState = 'confirmed' | 'unconfirmed' | 'violation'
type VerificationCheck = { state: CheckState; message: string; deduction: number }
type VerificationBreakdown = {
  safety: number
  legitimacy: number
  ai_relevance: number
  submission_quality: number
}

const relevantLinkPattern = /(about|company|contact|support|help|privacy|terms|policy|legal|회사|소개|문의|고객|개인정보|약관|정책)/i

function relevantInternalLinks(html: string, baseUrl: URL) {
  const links: URL[] = []
  const seen = new Set<string>()
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const candidate = `${match[1]} ${cleanText(match[2])}`
    if (!relevantLinkPattern.test(candidate)) continue
    try {
      const url = new URL(match[1], baseUrl)
      if (url.hostname !== baseUrl.hostname || !['http:', 'https:'].includes(url.protocol)) continue
      url.hash = ''
      const key = url.toString()
      if (!seen.has(key)) {
        seen.add(key)
        links.push(url)
      }
    } catch { /* Ignore malformed internal links. */ }
    if (links.length >= 4) break
  }
  return links
}

async function collectOfficialText(page: { html: string; finalUrl: URL }) {
  const chunks = [cleanText(page.html).slice(0, 18_000)]
  const checkedPages = [page.finalUrl.toString()]
  for (const link of relevantInternalLinks(page.html, page.finalUrl)) {
    try {
      const linkedPage = await fetchOfficialPage(link)
      chunks.push(cleanText(linkedPage.html).slice(0, 8_000))
      checkedPages.push(linkedPage.finalUrl.toString())
    } catch { /* A missing supporting page is unconfirmed, not a violation. */ }
  }
  return { text: chunks.join(' ').toLowerCase(), checkedPages }
}

function spamSignals(name: string, description: string) {
  const signals: string[] = []
  const combined = `${name} ${description}`.toLowerCase()
  if (name.length < 2 || name.length > 100) signals.push('도구명 길이가 비정상적입니다.')
  if (description.length < 15 || description.length > 500) signals.push('설명 길이가 등록 기준을 벗어납니다.')
  if ((description.match(/https?:\/\//gi) || []).length > 0) signals.push('설명에 외부 URL이 포함되어 있습니다.')
  if ((description.match(/#[\w가-힣]+/g) || []).length > 5) signals.push('해시태그가 과도하게 포함되어 있습니다.')
  if (/(추천인|레퍼럴|가입코드|쿠폰코드|무조건 수익|고수익|카지노|도박|성인)/i.test(combined)) signals.push('광고·유해성 키워드가 감지되었습니다.')
  if (/(.)\1{7,}/.test(combined)) signals.push('반복 문자가 과도합니다.')
  const words = description.toLowerCase().split(/\s+/).filter((word) => word.length > 1)
  if (words.length >= 8 && new Set(words).size / words.length < 0.45) signals.push('같은 단어가 과도하게 반복됩니다.')
  return signals
}

function wordSet(value: string) {
  return new Set(value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length >= 2))
}

function similarity(left: string, right: string) {
  const a = wordSet(left)
  const b = wordSet(right)
  if (a.size < 4 || b.size < 4) return 0
  let intersection = 0
  for (const word of a) if (b.has(word)) intersection += 1
  return intersection / (a.size + b.size - intersection)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: '지원하지 않는 요청입니다.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return json(500, { error: '서버 설정이 완료되지 않았습니다.' })

  const authorization = req.headers.get('Authorization') || ''
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json(401, { error: '로그인 후 도구를 제보할 수 있습니다.' })

  let payload: { name?: string; description?: string; url?: string; logo_url?: string }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: '잘못된 요청 형식입니다.' })
  }

  const name = payload.name?.trim() || ''
  const description = payload.description?.trim() || ''
  if (!name || !description || !payload.url?.trim()) return json(400, { error: '도구명, 설명, URL을 모두 입력해주세요.' })

  let normalized: string
  let rootDomain: string
  let submittedUrl: URL
  try {
    ({ normalized, rootDomain, url: submittedUrl } = normalizeUrl(payload.url))
    await assertPublicHost(submittedUrl.hostname)
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : '안전하지 않은 URL입니다.' })
  }

  const service = createClient(supabaseUrl, serviceKey)
  const [{ data: duplicateUrl }, { data: duplicateDomain }, { data: duplicateTool }, { data: reputation }] = await Promise.all([
    service.from('pending_tools').select('id,status').eq('normalized_url', normalized).limit(1),
    service.from('pending_tools').select('id,status').eq('root_domain', rootDomain).limit(1),
    service.from('tools').select('id,url,name').ilike('url', `%${rootDomain}%`).limit(5),
    service.from('submitter_reputation').select('*').eq('user_id', user.id).maybeSingle(),
  ])
  if (reputation?.submission_blocked_until && new Date(reputation.submission_blocked_until).getTime() > Date.now()) {
    const until = new Date(reputation.submission_blocked_until).toLocaleDateString('ko-KR')
    return json(403, { error: `허위·부적합 제보가 반복되어 ${until}까지 제보가 제한됩니다.` })
  }
  const exactPublished = (duplicateTool || []).some((tool) => {
    try { return normalizeUrl(tool.url || '').rootDomain === rootDomain } catch { return false }
  })
  if ((duplicateUrl && duplicateUrl.length > 0) || (duplicateDomain && duplicateDomain.length > 0) || exactPublished) {
    return json(409, { error: '이미 등록되었거나 관리자가 검토 중인 서비스입니다.' })
  }

  const contentSignals = spamSignals(name, description)
  const reputationSignals = await domainSignals(rootDomain)
  const signals = [...contentSignals, ...reputationSignals]
  const checks: Record<string, VerificationCheck> = {}
  let siteTitle = ''
  let siteDescription = ''
  let finalUrl = normalized
  let reachable = false
  let checkedPages: string[] = []
  let aiConfirmed = false
  try {
    const page = await fetchOfficialPage(submittedUrl)
    reachable = true
    finalUrl = page.finalUrl.toString()
    siteTitle = cleanText(page.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
    siteDescription = metaContent(page.html, 'description') || metaContent(page.html, 'og:description')
    const collected = await collectOfficialText(page)
    checkedPages = collected.checkedPages
    const officialText = `${siteTitle} ${siteDescription} ${collected.text}`.toLowerCase()
    const nameTokens = name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2)
    const suspiciousName = !/[\p{L}]/u.test(name) || nameTokens.length === 0
    const nameConfirmed = !suspiciousName && nameTokens.some((token) => officialText.includes(token))
    checks.name_match = nameConfirmed
      ? { state: 'confirmed', message: '도구명과 공식 사이트의 연관성을 확인했습니다.', deduction: 0 }
      : { state: 'unconfirmed', message: '입력한 도구명과 공식 사이트의 연관성을 확인하지 못했습니다.', deduction: 10 }
    if (!nameConfirmed) signals.push(checks.name_match.message)

    aiConfirmed = /(\bai\b|artificial intelligence|machine learning|생성형|인공지능|llm|gpt|자동화)/i.test(officialText)
    checks.ai_relevance = aiConfirmed
      ? { state: 'confirmed', message: '공식 사이트에서 AI 관련 기능을 확인했습니다.', deduction: 0 }
      : { state: 'unconfirmed', message: '공식 사이트에서 AI 관련 기능을 확인하지 못했습니다.', deduction: 10 }
    if (!aiConfirmed) signals.push(checks.ai_relevance.message)

    const companyConfirmed = /(contact|support|about|company|문의|고객센터|회사소개|사업자)/i.test(officialText)
    checks.company = companyConfirmed
      ? { state: 'confirmed', message: '회사 또는 연락처 정보를 확인했습니다.', deduction: 0 }
      : { state: 'unconfirmed', message: '회사 또는 연락처 정보를 자동으로 확인하지 못했습니다.', deduction: 5 }
    if (!companyConfirmed) signals.push(checks.company.message)

    const policyConfirmed = /(privacy|terms|policy|개인정보|이용약관|운영정책)/i.test(officialText)
    checks.policy = policyConfirmed
      ? { state: 'confirmed', message: '약관 또는 개인정보처리방침을 확인했습니다.', deduction: 0 }
      : { state: 'unconfirmed', message: '약관 또는 개인정보처리방침을 자동으로 확인하지 못했습니다.', deduction: 5 }
    if (!policyConfirmed) signals.push(checks.policy.message)
    if (/(checkout|buy now|purchase|결제하기|구매하기)/i.test(officialText) && !/(feature|product|solution|기능|제품|서비스)/i.test(officialText)) signals.push('제품 설명보다 결제 유도 정보가 중심인 사이트입니다.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '공식 사이트를 자동 확인하지 못했습니다.'
    checks.reachability = { state: 'violation', message, deduction: 30 }
    signals.push(message)
  }

  const [{ data: publishedDescriptions }, { data: submittedDescriptions }] = await Promise.all([
    service.from('tools').select('name,description').limit(200),
    service.from('pending_tools').select('name,description').limit(200),
  ])
  const copiedFrom = [...(publishedDescriptions || []), ...(submittedDescriptions || [])]
    .find((item) => item.description && similarity(description, item.description) >= 0.88)
  if (copiedFrom) signals.push(`기존 등록 '${copiedFrom.name || '이름 없음'}'의 설명과 지나치게 유사합니다.`)

  const trustScore = reputation?.trust_score ?? 50
  const hasShortDescription = contentSignals.includes('설명 길이가 등록 기준을 벗어납니다.')
  const hasAbusiveContent = contentSignals.some((signal) => /광고·유해성|반복|외부 URL|해시태그/.test(signal))
  const hasDomainRisk = reputationSignals.some((signal) => /위험 신호/.test(signal))
  const hasYoungDomain = reputationSignals.some((signal) => /등록 후/.test(signal))
  const copiedSignal = signals.find((signal) => /지나치게 유사/.test(signal))
  const nameDeduction = checks.name_match?.deduction ?? 10
  const companyDeduction = checks.company?.deduction ?? 5
  const policyDeduction = checks.policy?.deduction ?? 5
  const aiDeduction = checks.ai_relevance?.deduction ?? 10
  const qualityDeduction = Math.min(20, (hasShortDescription ? 10 : 0) + (hasAbusiveContent ? 15 : 0) + (copiedSignal ? 20 : 0))
  const breakdown: VerificationBreakdown = {
    safety: Math.max(0, 30 - (!reachable ? 30 : 0) - (hasDomainRisk ? 20 : 0) - (hasYoungDomain ? 5 : 0)),
    legitimacy: Math.max(0, 25 - nameDeduction - companyDeduction - policyDeduction),
    ai_relevance: Math.max(0, 25 - aiDeduction),
    submission_quality: Math.max(0, 20 - qualityDeduction),
  }
  const trustAdjustment = Math.round((trustScore - 50) * 0.1)
  const verificationScore = Math.max(0, Math.min(100, Object.values(breakdown).reduce((sum, score) => sum + score, 0) + trustAdjustment))
  const verificationStatus = !reachable || hasDomainRisk ? 'failed' : verificationScore >= 80 && aiConfirmed ? 'verified' : 'review'
  const verificationSummary = signals.length === 0
    ? '공식 사이트 접근, 도구명 연관성, AI 관련성 및 제출 내용 검사를 통과했습니다.'
    : `${signals.length}개의 확인 필요 신호가 감지되었습니다.`

  let logoUrl: string | null = null
  if (payload.logo_url?.trim()) {
    try {
      const parsedLogo = new URL(payload.logo_url.trim())
      if (['http:', 'https:'].includes(parsedLogo.protocol)) logoUrl = parsedLogo.toString()
    } catch { /* Invalid optional logo URLs are ignored. */ }
  }

  const { error: insertError } = await service.from('pending_tools').insert({
    name,
    description,
    url: finalUrl,
    normalized_url: normalized,
    root_domain: rootDomain,
    logo_url: logoUrl,
    submitted_by: user.email || user.id,
    submitted_by_user_id: user.id,
    status: 'pending',
    verification_status: verificationStatus,
    verification_score: verificationScore,
    verification_summary: verificationSummary,
    verification_signals: signals,
    source_metadata: {
      site_title: siteTitle,
      site_description: siteDescription,
      final_url: finalUrl,
      reachable,
      checked_pages: checkedPages,
      verification_version: 2,
      verification_breakdown: breakdown,
      verification_checks: checks,
      trust_adjustment: trustAdjustment,
    },
    submitter_trust_score: trustScore,
  })

  if (insertError) {
    if (insertError.code === '23505') return json(409, { error: '이미 등록되었거나 관리자가 검토 중인 서비스입니다.' })
    console.error('Submission insert failed', insertError.code)
    return json(500, { error: '제보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' })
  }

  await service.from('submitter_reputation').upsert({
    user_id: user.id,
    trust_score: trustScore,
    approved_count: reputation?.approved_count ?? 0,
    rejected_count: reputation?.rejected_count ?? 0,
    last_submission_at: new Date().toISOString(),
    submission_blocked_until: reputation?.submission_blocked_until ?? null,
    updated_at: new Date().toISOString(),
  })

  return json(201, { message: '제보가 접수되었습니다. 자동 검증 결과와 함께 관리자가 검토합니다.', verification_status: verificationStatus })
})
