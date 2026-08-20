import { withoutTrailingSlash } from 'ufo'

interface RedirectEntry {
  from: string
  to: string
  code: string
}

// Editor-managed redirects from the Panel (site.yml → redirects tab),
// cached in memory for 5 minutes
let cachedRedirects: RedirectEntry[] | null = null
let cachedAt = 0
const CACHE_TTL = 5 * 60 * 1000

const ALLOWED_CODES = new Set(['301', '302', '307', '308'])

/**
 * Redirect targets come from the Panel, so an editor account is all it takes
 * to point one somewhere else. Only site-relative paths and absolute http(s)
 * URLs are followed — anything else (`javascript:`, `//evil.tld`, a newline
 * smuggled into the header) is dropped.
 */
function isSafeTarget(to: string) {
  if (/[\r\n]/.test(to)) {
    return false
  }

  // Site-relative, but not protocol-relative (`//evil.tld`)
  if (to.startsWith('/')) {
    return !to.startsWith('//')
  }

  try {
    return ['http:', 'https:'].includes(new URL(to).protocol)
  }
  catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const path = withoutTrailingSlash(event.path.split('?')[0] ?? '') || '/'

  // Skip internal and asset requests
  if (path.startsWith('/api') || path.startsWith('/_') || path.includes('.')) {
    return
  }

  if (!cachedRedirects || Date.now() - cachedAt > CACHE_TTL) {
    try {
      const data = await $kql({
        query: 'site',
        select: {
          redirects: 'site.redirects.toStructure',
        },
      })
      cachedRedirects = (data?.result?.redirects as RedirectEntry[] | undefined) ?? []
      cachedAt = Date.now()
    }
    catch {
      // Kirby unreachable: skip redirects rather than failing the request
      return
    }
  }

  const match = cachedRedirects.find(
    entry => withoutTrailingSlash(entry.from) === path,
  )

  if (match && isSafeTarget(match.to)) {
    await sendRedirect(event, match.to, ALLOWED_CODES.has(match.code) ? Number(match.code) : 301)
  }
})
