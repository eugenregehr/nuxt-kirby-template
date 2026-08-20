<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

defineProps<{
  block: KirbyBlock<BlockContent, 'quote'>
}>()
</script>

<template>
  <figure class="mx-auto my-8 max-w-3xl border-l-4 border-gray-300 px-4 py-2">
    <blockquote
      class="rich-text text-xl italic"
      v-html="block.content.text"
    />
    <figcaption v-if="block.content.citation" class="mt-2 text-sm text-gray-500">
      — {{ block.content.citation }}
    </figcaption>
  </figure>
</template>
