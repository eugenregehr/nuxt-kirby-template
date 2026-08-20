<script setup lang="ts">
// Adds the `lang` attribute and the hreflang alternate links per locale.
// `useLocaleHead()` is reactive, so it is passed to `useHead` as a getter.
//
// `<NuxtLayout>` is rendered by the pages, not here: the header's language
// switcher needs the page's translated slugs, and a layout wrapped around
// `<NuxtPage>` renders before the page's async setup has fetched them.
const localeHead = useLocaleHead()

useHead(() => ({
  htmlAttrs: { lang: localeHead.value.htmlAttrs?.lang },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ...(localeHead.value.link ?? []),
  ],
  meta: localeHead.value.meta ?? [],
}))
</script>

<template>
  <NuxtPage />
</template>
