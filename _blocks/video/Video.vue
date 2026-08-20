<script setup lang="ts">
import type { KirbyBlock } from '../_shared/types'
import type { BlockContent } from './types'

const props = defineProps<{
  block: KirbyBlock<BlockContent, 'video'>
}>()

// Normalize YouTube/Vimeo URLs to their embeddable form
const embedUrl = computed(() => {
  const url = props.block.content.url
  if (!url)
    return null

  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (youtube)
    return `https://www.youtube-nocookie.com/embed/${youtube[1]}`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo)
    return `https://player.vimeo.com/video/${vimeo[1]}`

  return url
})
</script>

<template>
  <figure v-if="embedUrl" class="mx-auto my-8 max-w-3xl px-4">
    <div class="aspect-video overflow-hidden rounded-lg">
      <iframe
        :src="embedUrl"
        class="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      />
    </div>
    <figcaption v-if="block.content.caption" class="mt-2 text-sm text-gray-500">
      {{ block.content.caption }}
    </figcaption>
  </figure>
</template>
