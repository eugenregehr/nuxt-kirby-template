<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

const props = defineProps<{
  block: KirbyBlock<BlockContent, 'faq'>
}>()

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

// FAQPage structured data for search engines
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': props.block.content.items.map(item => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer.replace(/<[^>]*>/g, ''),
          },
        })),
      })),
    },
  ],
})
</script>

<template>
  <section class="mx-auto my-12 max-w-3xl px-4">
    <component
      :is="block.content.level"
      v-if="block.content.heading && block.content.level !== 'none'"
      class="mb-6 text-3xl font-bold"
    >
      {{ block.content.heading }}
    </component>

    <div class="divide-y divide-gray-200 border-y border-gray-200">
      <div v-for="(item, index) in block.content.items" :key="index">
        <button
          type="button"
          class="flex w-full items-center justify-between py-4 text-left font-medium"
          :aria-expanded="openIndex === index"
          @click="toggle(index)"
        >
          {{ item.question }}
          <span aria-hidden="true">{{ openIndex === index ? '−' : '+' }}</span>
        </button>
        <div
          v-show="openIndex === index"
          class="rich-text pb-4 text-gray-600"
          v-html="item.answer"
        />
      </div>
    </div>
  </section>
</template>
