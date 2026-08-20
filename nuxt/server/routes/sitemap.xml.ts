import { SitemapStream, streamToPromise } from 'sitemap'
import { joinURL } from 'ufo'

interface KirbySitemapItem {
  url: string
  modified?: string
  links?: Array<{ lang: string, url: string }>
}

interface KirbyApiResponse<T> {
  code: number
  status: string
  result?: T
}

// Nuxt i18n uses `prefix_except_default`: the default locale has no URL
// prefix, while Kirby's sitemap data includes one for every language.
const DEFAULT_LOCALE = 'de'

function stripDefaultLocalePrefix(path: string) {
  if (path === `/${DEFAULT_LOCALE}` || path.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return path.slice(DEFAULT_LOCALE.length + 1) || '/'
  }
  return path
}

export default defineEventHandler(async (event) => {
  const { siteUrl } = useRuntimeConfig(event).public

  // The `__sitemap__` endpoint is provided by the kirby-headless plugin
  const response = await $kirby<KirbyApiResponse<KirbySitemapItem[]>>('api/__sitemap__')
  const items = response?.result ?? []

  const stream = new SitemapStream({ hostname: siteUrl })

  for (const item of items) {
    stream.write({
      url: stripDefaultLocalePrefix(item.url),
      lastmod: item.modified,
      links: item.links?.map(link => ({
        lang: link.lang,
        url: joinURL(siteUrl, stripDefaultLocalePrefix(link.url)),
      })),
    })
  }

  stream.end()

  setResponseHeader(event, 'Content-Type', 'application/xml')
  return streamToPromise(stream)
})
