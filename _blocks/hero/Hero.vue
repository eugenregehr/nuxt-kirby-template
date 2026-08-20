<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

defineProps<{
  block: KirbyBlock<BlockContent, 'hero'>
}>()
</script>

<template>
  <section class="bg-gray-900 px-4 py-24 text-center text-white">
    <div class="mx-auto max-w-3xl">
      <component
        :is="block.content.level || 'h1'"
        class="text-4xl font-bold sm:text-5xl"
      >
        {{ block.content.headline }}
      </component>
      <p v-if="block.content.text" class="mt-6 text-lg text-gray-300">
        {{ block.content.text }}
      </p>
      <NuxtLink
        v-if="block.content.link && block.content.buttonlabel"
        :to="block.content.link"
        class="mt-8 inline-block rounded-full bg-white px-6 py-3 font-medium text-gray-900 transition hover:bg-gray-200"
      >
        {{ block.content.buttonlabel }}
      </NuxtLink>
    </div>
  </section>
</template>
