<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

defineProps<{
  block: KirbyBlock<BlockContent, 'cta'>
}>()
</script>

<template>
  <section class="mx-auto my-12 max-w-3xl px-4">
    <div class="rounded-2xl bg-gray-100 p-8 text-center sm:p-12">
      <component
        :is="block.content.level"
        v-if="block.content.heading && block.content.level !== 'none'"
        class="text-2xl font-bold"
      >
        {{ block.content.heading }}
      </component>
      <p v-if="block.content.text" class="mt-3 text-gray-600">
        {{ block.content.text }}
      </p>
      <NuxtLink
        v-if="block.content.link && block.content.buttonlabel"
        :to="block.content.link"
        class="mt-6 inline-block rounded-full bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700"
      >
        {{ block.content.buttonlabel }}
      </NuxtLink>
    </div>
  </section>
</template>
