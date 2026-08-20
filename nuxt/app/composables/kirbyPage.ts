import type { KirbyQueryResponse, KirbyQuerySchema } from 'kirby-types'
import type { KirbyPageData, KirbySharedPageData } from '~/queries'
import { pageSelects } from '#baukasten/pages'
import { getPageQuery } from '~/queries'

type PageQueryFactory = (options: { draft: boolean }) => KirbyQuerySchema

/**
 * Fetches a Kirby page (with live-preview support), throws a 404 if it
 * doesn't exist and registers it via `setPage()`. The standard way to load
 * page data in a page component:
 *
 *   const page = await useKirbyPage(uri)
 *
 * Page types that bring their own rendering (`_pages/<typ>/`) need no call of
 * their own: which template a page uses is only known once it has been
 * fetched, so this issues a second request with the select the package
 * declares. Block-based pages — the majority — stay at one request.
 *
 * Passing a query factory skips that dispatch and fetches exactly what the
 * factory asks for.
 *
 * Note: this wraps `$kql` in `useAsyncData` instead of using `useKql`, so the
 * cache key stays deterministic per locale/uri/preview state and the optional
 * second request can be issued conditionally.
 */
export async function useKirbyPage<T extends KirbySharedPageData = KirbyPageData>(
  uri: string,
  queryFactory?: PageQueryFactory,
) {
  const nuxtApp = useNuxtApp()
  const { locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const { isPreview, previewHeaders } = useKirbyPreview()

  function fetchPage(query: KirbyQuerySchema, keySuffix = '') {
    return useAsyncData(
      `page:${locale.value}:${uri}${keySuffix}${isPreview ? ':preview' : ''}`,
      () => $kql<KirbyQueryResponse<T>>(query, {
        language: locale.value,
        headers: previewHeaders(uri),
        payloadCache: !isPreview,
      }),
    )
  }

  const query = queryFactory
    ? queryFactory({ draft: isPreview })
    : getPageQuery(uri, { draft: isPreview })

  const { data } = await fetchPage(query)

  let page = data.value?.result

  // The first response carries `intendedTemplate`. If a page package claims
  // that template, fetch again with the select it declares — the Nuxt
  // instance is lost after the `await` above, hence `runWithContext`.
  const template = !queryFactory ? page?.intendedTemplate : undefined
  const select = template ? pageSelects[template] : undefined

  if (select) {
    const { data: templateData } = await nuxtApp.runWithContext(
      () => fetchPage(getPageQuery(uri, { draft: isPreview, select }), `:${template}`),
    )

    page = templateData.value?.result ?? page
  }

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: `Page not found: /${uri}`,
      // On the server a thrown error already renders the error page;
      // `fatal` is only needed for client-side navigation. Marking it
      // fatal on the server would log a noisy [request error] for every 404.
      fatal: import.meta.client,
    })
  }

  // Narrowed to a const so the closures below keep the non-nullable type
  const resolved = page

  // Kirby answers to a page's slug in every language, so `/en/bloecke` serves
  // the same page as `/en/blocks` — and the home page also answers at `/home`.
  // Send everything but the canonical path of the active language to a 301,
  // so a page never exists under two URLs. Skipped in preview: the Panel
  // opens the frontend with query params this would drop.
  if (!isPreview) {
    const canonical = await nuxtApp.runWithContext(
      () => localePath(resolved.uri === 'home' ? '/' : `/${resolved.uri}`),
    )

    if (canonical && canonical !== route.path) {
      return await nuxtApp.runWithContext(
        () => navigateTo(canonical, { redirectCode: 301 }),
      ) as never
    }
  }

  // The Nuxt instance is lost after `await` inside a composable —
  // restore it so `setPage` can use useState/useRoute/useHead
  await nuxtApp.runWithContext(() => setPage(resolved))

  return resolved
}
