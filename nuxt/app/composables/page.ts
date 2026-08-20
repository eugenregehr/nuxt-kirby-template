import type { KirbySharedPageData } from '~/queries'
import { joinURL } from 'ufo'

/**
 * Returns the currently active page, similar to Kirby's `$page` global.
 */
export function usePage<T extends Record<string, any> = Record<string, any>>() {
  return useState<T>('app.page', () => ({}) as T)
}

/**
 * Sets the currently active page and derives all SEO/OG meta tags with a
 * fallback chain: page SEO field → page content field → site SEO field →
 * site content field. Call this once per page after fetching its data.
 */
export function setPage<T extends KirbySharedPageData & Record<string, any>>(page: T) {
  usePage().value = page

  setLocalizedSlugs(page)

  const { siteUrl } = useRuntimeConfig().public
  const site = useSite()
  const pageTitle = page.seo_title || page.title
  const title = pageTitle
    ? `${pageTitle} – ${site.value.title}`
    : site.value.seo_title || site.value.title
  const description = page.seo_description || site.value.seo_description
  const url = joinURL(siteUrl, useRoute().path)
  const image = page.og_image?.url || page.cover?.url || site.value.og_image?.url || site.value.cover?.url

  useHead({
    bodyAttrs: {
      // Enables template-scoped CSS via body[data-template="..."]
      'data-template': page.intendedTemplate || 'default',
    },
  })

  useServerHead({
    link: [{ rel: 'canonical', href: url }],
  })

  useSeoMeta({
    title,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  })

  useServerSeoMeta({
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogType: 'website',
    ...(image && { ogImage: image }),
    twitterTitle: title,
    twitterDescription: description,
    twitterCard: image ? 'summary_large_image' : 'summary',
    ...(image && { twitterImage: image }),
  })
}

/**
 * Kirby slugs can be translated (`/bloecke` ↔ `/en/blocks`), which Nuxt i18n
 * cannot know on its own — it would keep the current slug and link to
 * `/en/bloecke`. Handing it the URI of each language fixes both the language
 * switcher and the hreflang alternates.
 *
 * Only the catch-all route takes a slug param; the home route has none.
 */
function setLocalizedSlugs(page: KirbySharedPageData & Record<string, any>) {
  const setI18nParams = useSetI18nParams()
  const route = useRoute()

  if (!page.i18nMeta || route.params.slug === undefined) {
    return
  }

  setI18nParams(
    Object.fromEntries(
      Object.entries(page.i18nMeta).map(([code, meta]) => [
        code,
        { slug: meta.uri.split('/') },
      ]),
    ),
  )
}
