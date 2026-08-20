<script setup lang="ts">
import type { KirbyBlock, ResolvedKirbyImage } from '../_shared/types'
import type { BlockContent } from './types'

const props = defineProps<{
  block: KirbyBlock<BlockContent, 'image'>
}>()

// The files resolver returns an array for the default image block field
const image = computed<ResolvedKirbyImage | null>(() => {
  const value = props.block.content.image
  return Array.isArray(value) ? value[0] ?? null : value
})
</script>

<template>
  <figure v-if="image" class="mx-auto my-8 max-w-3xl px-4">
    <img
      :src="image.url"
      :srcset="image.srcset"
      :width="image.width"
      :height="image.height"
      :alt="block.content.alt || image.alt || ''"
      loading="lazy"
      class="h-auto w-full rounded-lg"
    >
    <figcaption v-if="block.content.caption" class="mt-2 text-sm text-gray-500">
      {{ block.content.caption }}
    </figcaption>
  </figure>
</template>
