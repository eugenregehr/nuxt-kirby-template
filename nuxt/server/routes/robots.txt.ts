import { joinURL } from 'ufo'

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const host = getRequestHost(event)

  setResponseHeader(event, 'Content-Type', 'text/plain')

  // Block indexing on any host that is not the canonical domain
  // (preview deployments, staging, localhost)
  const canonicalHost = siteUrl ? new URL(siteUrl).host : null
  const isProduction = canonicalHost !== null && host === canonicalHost

  if (!isProduction) {
    return 'User-agent: *\nDisallow: /'
  }

  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${joinURL(siteUrl, 'sitemap.xml')}`,
  ].join('\n')
})
