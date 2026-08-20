<script setup lang="ts">
/**
 * Catch-all route: renders every Kirby page. Block-based pages (the `default`
 * blueprint) and page types with their own package under `pages/` both go
 * through here — `<KirbyPageBody>` dispatches on the page's template.
 */
const route = useRoute()

const uri = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug ?? '')

const page = await useKirbyPage(uri)
</script>

<template>
  <NuxtLayout>
    <KirbyPageBody :page="page" />
  </NuxtLayout>
</template>
