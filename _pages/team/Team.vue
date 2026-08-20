<script setup lang="ts">
import type { KirbyPage } from '../_shared/types'
import type { PageContent } from './query'
import Members from './parts/Members.vue'

/**
 * Rendered for every Kirby page whose template is `team` — the catch-all
 * route dispatches on `intendedTemplate`, so this is not bound to one URI.
 */
defineProps<{
  page: KirbyPage<PageContent>
}>()
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-16">
    <h1 class="text-4xl font-bold">
      {{ page.headline }}
    </h1>
    <p v-if="page.intro" class="mt-4 text-lg text-gray-600">
      {{ page.intro }}
    </p>

    <Members :members="page.members" />
  </section>

  <!-- Blocks from the page-builder tab, rendered like on any other page -->
  <KirbyBlocks :blocks="page.blocks" />
</template>
