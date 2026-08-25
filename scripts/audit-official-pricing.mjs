const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
}

const toolsResponse = await fetch(
  `${supabaseUrl}/rest/v1/tools?select=name,pricing_type,pricing_start_at,pricing_summary,pricing_details,pricing_currency,billing_period,pricing_url,pricing_verified_at,service_status&order=name.asc`,
  { headers: { apikey: anonKey } },
);

if (!toolsResponse.ok) {
  throw new Error(`Could not load tools: ${toolsResponse.status}`);
}

const tools = await toolsResponse.json();

function priceTokens(tool) {
  const combined = [tool.pricing_start_at, tool.pricing_summary, ...(tool.pricing_details ?? [])]
    .filter(Boolean)
    .join(' ');
  const matches = combined.match(/(?:US\$|CA\$|AU\$|€|£|¥|₩|\$)\s?[\d,.]+|[\d,.]+\s?(?:USD|EUR|GBP|KRW|원)/gi) ?? [];
  return [...new Set(matches.map((value) => value
    .replace(/\s+/g, '')
    .replace(/,$/, '')
    .toLowerCase()))];
}

function normalizePriceText(value) {
  return value
    .toLowerCase()
    .replace(/&nbsp;|&#160;/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '');
}

async function audit(tool) {
  if (!tool.pricing_url) {
    return { ...tool, audit_status: 'missing_url', http_status: null, expected_tokens: priceTokens(tool), matched_tokens: [] };
  }

  try {
    const response = await fetch(tool.pricing_url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; ModuAI-PricingAudit/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    const body = normalizePriceText(await response.text());
    const expected = priceTokens(tool);
    const matched = expected.filter((token) => {
      if (['$0', 'us$0', '0원', '0krw', '0usd'].includes(token)) {
        return body.includes('free') || body.includes('무료') || body.includes(normalizePriceText(token));
      }
      return body.includes(normalizePriceText(token));
    });
    const protectedStatus = response.status === 401 || response.status === 403 || response.status === 429;
    const auditStatus = !response.ok
      ? (protectedStatus ? 'blocked' : 'http_error')
      : expected.length === 0
        ? 'manual_review'
        : matched.length === expected.length
          ? 'matched'
          : matched.length > 0
            ? 'partial_match'
            : 'mismatch';

    return {
      ...tool,
      audit_status: auditStatus,
      http_status: response.status,
      final_url: response.url,
      expected_tokens: expected,
      matched_tokens: matched,
    };
  } catch (error) {
    return {
      ...tool,
      audit_status: 'network_error',
      http_status: null,
      expected_tokens: priceTokens(tool),
      matched_tokens: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const concurrency = 16;
const results = [];
for (let index = 0; index < tools.length; index += concurrency) {
  results.push(...await Promise.all(tools.slice(index, index + concurrency).map(audit)));
}

const counts = results.reduce((accumulator, result) => {
  accumulator[result.audit_status] = (accumulator[result.audit_status] ?? 0) + 1;
  return accumulator;
}, {});

const report = { total: results.length, counts, results };
if (process.env.PRICING_AUDIT_COUNTS === '1') {
  const names = Object.fromEntries(
    Object.keys(counts).map((status) => [status, results.filter((result) => result.audit_status === status).map((result) => result.name)]),
  );
  process.stdout.write(`${JSON.stringify({ total: results.length, counts, names }, null, 2)}\n`);
} else if (process.env.PRICING_AUDIT_SUMMARY === '1') {
  const review = results
    .filter((result) => result.audit_status !== 'matched')
    .map(({ name, audit_status, http_status, pricing_summary, pricing_url, expected_tokens, matched_tokens }) => ({
      name,
      audit_status,
      http_status,
      pricing_summary,
      pricing_url,
      expected_tokens,
      matched_tokens,
    }));
  process.stdout.write(`${JSON.stringify({ total: results.length, counts, review }, null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
