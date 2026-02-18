/**
 * URL normalization utilities.
 * Strips tracking parameters, normalises protocol/trailing-slash,
 * and maps domains to auto-suggested tags.
 */

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  'msclkid', 'twclid', '_ga', '_gl', 'mc_eid', 'mc_cid',
  'igshid', 'yclid', 'ref', 'source', 'share', 'campaign_id',
])

export interface NormalizeResult {
  url: string
  strippedCount: number
}

/** Strip tracking params, force https, remove trailing slash. */
export function normalizeUrl(raw: string): NormalizeResult {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { url: raw, strippedCount: 0 }
  }

  parsed.protocol = 'https:'

  const toDelete: string[] = []
  parsed.searchParams.forEach((_, key) => {
    if (TRACKING_PARAMS.has(key.toLowerCase())) toDelete.push(key)
  })
  toDelete.forEach((k) => parsed.searchParams.delete(k))

  // Remove trailing slash from path (keep root "/" as-is)
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1)
  }

  // Sort remaining params for stable deduplication
  parsed.searchParams.sort()

  return { url: parsed.toString(), strippedCount: toDelete.length }
}

// ─── Domain → tag mapping ─────────────────────────────────────────────────

const DOMAIN_TAG_MAP: [string, string[]][] = [
  ['github.com',              ['code']],
  ['gitlab.com',              ['code']],
  ['bitbucket.org',           ['code']],
  ['stackoverflow.com',       ['code', 'reference']],
  ['stackexchange.com',       ['reference']],
  ['npmjs.com',               ['code']],
  ['pypi.org',                ['code']],
  ['crates.io',               ['code']],
  ['pkg.go.dev',              ['code']],
  ['developer.mozilla.org',   ['docs', 'reference']],
  ['docs.rs',                 ['docs']],
  ['youtube.com',             ['video']],
  ['youtu.be',                ['video']],
  ['vimeo.com',               ['video']],
  ['twitch.tv',               ['video']],
  ['medium.com',              ['article']],
  ['dev.to',                  ['article', 'code']],
  ['hashnode.com',            ['article']],
  ['substack.com',            ['newsletter', 'article']],
  ['news.ycombinator.com',    ['article']],
  ['reddit.com',              ['community']],
  ['x.com',                   ['social']],
  ['twitter.com',             ['social']],
  ['linkedin.com',            ['social']],
  ['figma.com',               ['design']],
  ['dribbble.com',            ['design']],
  ['behance.net',             ['design']],
  ['producthunt.com',         ['product']],
  ['arxiv.org',               ['research', 'paper']],
  ['scholar.google.com',      ['research']],
  ['wikipedia.org',           ['reference']],
  ['notion.so',               ['productivity']],
  ['obsidian.md',             ['productivity']],
]

/** Returns suggested tags for a URL based on its domain. */
export function autoTagsForUrl(url: string): string[] {
  try {
    const { hostname } = new URL(url)
    const domain = hostname.replace(/^www\./, '')
    for (const [key, tags] of DOMAIN_TAG_MAP) {
      if (domain === key || domain.endsWith('.' + key)) {
        return tags
      }
    }
    // Fallback heuristics on subdomain patterns
    if (domain.startsWith('docs.') || domain.startsWith('documentation.')) return ['docs']
    if (domain.startsWith('blog.')) return ['article']
    if (domain.startsWith('api.')) return ['docs']
  } catch { /* noop */ }
  return []
}
