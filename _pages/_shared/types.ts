/**
 * Types shared by every page-type package.
 *
 * Page packages live outside the Nuxt app, so they import from here with a
 * relative path (`../_shared/types`) instead of the `#shared` alias — and
 * without any npm dependency, because node_modules only exists inside `nuxt/`.
 */

/** Title and URI of a page in one language, keyed by language code */
export interface KirbyI18nMeta {
  [languageCode: string]: {
    title: string
    uri: string
  }
}

/** Fields every page query selects, regardless of its template */
export interface KirbySharedPageData {
  uri: string
  title: string
  intendedTemplate: string
  /**
   * Slugs may be translated (`/bloecke` ↔ `/en/blocks`), so every page
   * carries its URI in each language. Empty on a single-language site.
   */
  i18nMeta?: KirbyI18nMeta
  seo_title: string
  seo_description: string
  cover?: {
    url: string
  }
  og_image?: {
    url: string
  }
}

/**
 * A page as its component receives it: the shared fields above plus the
 * `PageContent` the package declares in its own `query.ts`.
 */
export type KirbyPage<TContent> = KirbySharedPageData & TContent

/** The models a KQL query can start from */
type KirbyQueryModel
  = 'arrayItem' | 'block' | 'collection' | 'content' | 'file' | 'item'
    | 'kirby' | 'page' | 'site' | 'structureItem' | 'user'

/** A KQL query string, e.g. `page.members.toStructure` */
export type KirbyQueryString
  = KirbyQueryModel | `${KirbyQueryModel}.${string}` | `${KirbyQueryModel}(${string})${string}`

/**
 * A KQL `select` fragment. Mirrors `KirbyQuerySchema['select']` from
 * `kirby-types`, which packages cannot import (see above), and stays
 * assignable to it.
 */
export interface KirbyPageSelect {
  [field: string]: boolean | string | {
    query: KirbyQueryString
    select?: KirbyPageSelect | string[]
  }
}
