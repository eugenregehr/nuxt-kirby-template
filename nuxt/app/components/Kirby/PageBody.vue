<script setup lang="ts">
import type { KirbyPageBlock } from '#baukasten/blocks'
import type { KirbySharedPageData } from '~/queries'
import { pageComponents } from '#baukasten/pages'

/**
 * Renders a Kirby page: the component of its page package (`_pages/<typ>/`)
 * if one claims its template, otherwise the block list. Both registries are
 * generated — see nuxt/modules/baukasten.ts.
 */
const props = defineProps<{
  // `blocks` is optional: a page type with fixed fields has no blocks field
  page: KirbySharedPageData & { blocks?: KirbyPageBlock[] }
}>()

const templateComponent = computed(() => pageComponents[props.page.intendedTemplate])
</script>

<template>
  <component :is="templateComponent" v-if="templateComponent" :page="page" />
  <KirbyBlocks v-else :blocks="page.blocks ?? []" />
</template>
