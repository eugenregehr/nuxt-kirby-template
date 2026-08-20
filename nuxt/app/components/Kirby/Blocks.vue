<script setup lang="ts">
import type { KirbyPageBlock } from '#baukasten/blocks'
import { blockComponents } from '#baukasten/blocks'

defineProps<{
  blocks: KirbyPageBlock[]
}>()

/**
 * The registry is generated from the block packages in `blocks/`
 * (see nuxt/modules/baukasten.ts) — adding a block needs no change here.
 */
</script>

<template>
  <template v-for="block in blocks" :key="block.id">
    <component
      :is="blockComponents[block.type]"
      v-if="blockComponents[block.type] && !block.isHidden"
      :block="block"
    />
  </template>
</template>
