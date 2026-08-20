/**
 * Live preview for the Kirby Panel.
 *
 * The Panel preview button opens this frontend with `?_token=...` (and
 * `&_version=changes` for unpublished edits). To display that version, the
 * page's KQL request must forward the token back to Kirby as headers — the
 * `preview-token` plugin in the backend verifies it and serves the draft
 * content. Responses are never cached in preview mode.
 *
 * `useKirbyPage()` already does this for every page — reach for this
 * composable directly only in a route that builds its own query.
 */
export function useKirbyPreview() {
  const route = useRoute()

  const token = typeof route.query._token === 'string' ? route.query._token : undefined
  // Draft pages get only `_token` (their version is "latest"), published
  // pages with unpublished edits additionally get `_version=changes`
  const version = typeof route.query._version === 'string' ? route.query._version : 'latest'

  const isPreview = Boolean(token)

  function previewHeaders(pageUri: string): Record<string, string> {
    if (!token) {
      return {}
    }

    return {
      'X-Preview-Token': token,
      'X-Preview-Version': version,
      'X-Preview-Page': pageUri,
      'X-Cacheable': 'false',
    }
  }

  return { isPreview, previewHeaders }
}
