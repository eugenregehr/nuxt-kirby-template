<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

defineProps<{
  block: KirbyBlock<BlockContent, 'list'>
}>()
</script>

<template>
  <div
    class="rich-text mx-auto max-w-3xl px-4"
    v-html="block.content.text"
  />
</template>
