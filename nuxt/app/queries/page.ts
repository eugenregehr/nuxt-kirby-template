import type { KirbyQueryResponse, KirbyQuerySchema } from 'kirby-types'
import type { KirbyPageBlock } from '#baukasten/blocks'
import type { KirbySharedPageData } from '#baukasten/pages'

/**
 * The fields every page query selects live with the page packages
 * (`_pages/_shared/types.ts`), because their components are typed against
 * them. Spread `...sharedQuerySelects` into the `select` of every page query.
 */
export type { KirbySharedPageData } from '#baukasten/pages'

export interface KirbyPageData extends KirbySharedPageData {
  blocks: KirbyPageBlock[]
}

export type KirbyPageResponse = KirbyQueryResponse<KirbyPageData>

export const sharedQuerySelects: KirbyQuerySchema['select'] = {
  uri: true,
  title: true,
  intendedTemplate: true,
  // Page method of the kirby-headless plugin: the URI per language
  i18nMeta: true,
  seo_title: true,
  seo_description: true,
  cover: {
    query: 'page.cover.toFile?.resize(1200)',
    select: ['url'],
  },
  og_image: {
    query: 'page.og_image.toFiles.first?.resize(1200)',
    select: ['url'],
  },
}

export interface PageQueryOptions {
  /**
   * Find the page with `site.findPageOrDraft` so unpublished drafts can be
   * previewed. Only enable this in preview mode — the backend rejects the
   * request if the preview token is invalid.
   */
  draft?: boolean
  /**
   * The select fragment of a page type (`_pages/<typ>/query.ts`). Defaults to
   * the blocks builder, which is what block-based pages need.
   */
  select?: KirbyQuerySchema['select']
}

export function getPageQuery(pageId: string, options: PageQueryOptions = {}): KirbyQuerySchema {
  // KQL interpolates the id into a query string — never pass unsanitized input
  const safeId = pageId.replace(/["\\]/g, '')

  return {
    // `site.find` excludes drafts — KQL's `page()` helper would expose them
    query: options.draft
      ? `site.findPageOrDraft("${safeId}")`
      : `site.find("${safeId}")`,
    select: {
      // `toResolvedBlocks` is provided by the kirby-headless plugin and
      // resolves UUIDs (images, links) via blocks-resolver.php
      ...(options.select ?? { blocks: 'page.blocks.toResolvedBlocks' }),
      ...sharedQuerySelects,
    },
  }
}
