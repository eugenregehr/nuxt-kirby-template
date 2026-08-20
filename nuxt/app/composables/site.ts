import type { KirbySiteData } from '~/queries'

/**
 * Global site data (title, nav children, SEO defaults), similar to Kirby's
 * `$site` global. Populated by `app/plugins/site.ts` on every SSR request.
 */
export function useSite() {
  return useState<Partial<KirbySiteData>>('app.site', () => ({}))
}
