<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

const props = defineProps<{
  block: KirbyBlock<BlockContent, 'heading'>
}>()

const tag = computed(() => props.block.content.level || 'h2')
</script>

<template>
  <component
    :is="tag"
    class="mx-auto mt-12 mb-4 max-w-3xl px-4 text-3xl font-bold"
  >
    {{ block.content.text }}
  </component>
</template>
