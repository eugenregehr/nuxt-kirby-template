import type { FetchError } from 'ofetch'
import type { NuxtApp } from '#app'
import type { KirbySiteResponse } from '~/queries'
import { siteQuery } from '~/queries'

/**
 * Loads the global site data (nav, SEO defaults) once per SSR request and
 * refreshes it on the client only when the locale changes.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const site = useSite()
  const i18n = nuxtApp.$i18n as NuxtApp['$i18n']

  if (import.meta.server) {
    await updateSite(i18n.locale.value)
  }
  else if (import.meta.client) {
    nuxtApp.hook('i18n:beforeLocaleSwitch', async ({ newLocale }) => {
      await updateSite(newLocale)
    })
  }

  async function updateSite(language?: string) {
    try {
      const data = await $kql<KirbySiteResponse>(siteQuery, { language })
      site.value = data?.result || {}
    }
    catch (error) {
      console.error('Failed to fetch site data:', (error as FetchError).message)
    }
  }
})
