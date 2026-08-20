<script setup lang="ts">
import type { NuxtError } from '#app'
import type { KirbyErrorResponse } from '~/queries'
import { errorQuery } from '~/queries'

const props = defineProps<{
  error: NuxtError
}>()

// Error page content is editable in the Panel (error page blueprint)
const { data } = await useAsyncData(
  'error-page',
  () => $kql<KirbyErrorResponse>(errorQuery),
)

const content = computed(() => data.value?.result)

useSeoMeta({
  title: () => content.value?.headline || String(props.error.statusCode),
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <p class="text-sm font-medium text-gray-400">
      {{ error.statusCode }}
    </p>
    <h1 class="mt-2 text-4xl font-bold">
      {{ content?.headline || 'Error' }}
    </h1>
    <p v-if="content?.text" class="mt-4 text-gray-600">
      {{ content.text }}
    </p>
    <NuxtLink
      to="/"
      class="mt-8 rounded-full bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700"
      @click="clearError()"
    >
      Home
    </NuxtLink>
  </div>
</template>
