<script setup lang="ts">
const site = useSite()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale, locales } = useI18n()

// Main navigation: all listed top-level pages from Kirby
const navItems = computed(() =>
  (site.value.children ?? []).filter(child => child.isListed && child.uri !== 'home'),
)

const otherLocales = computed(() =>
  locales.value.filter(l => l.code !== locale.value),
)
</script>

<template>
  <header class="border-b border-gray-200">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
      <NuxtLink :to="localePath('/')" class="font-bold">
        {{ site.title }}
      </NuxtLink>

      <nav class="flex items-center gap-6 text-sm">
        <NuxtLink
          v-for="item in navItems"
          :key="item.uri"
          :to="localePath(`/${item.uri}`)"
          class="hover:underline"
        >
          {{ item.title }}
        </NuxtLink>

        <NuxtLink
          v-for="l in otherLocales"
          :key="l.code"
          :to="switchLocalePath(l.code)"
          class="text-gray-400 uppercase hover:text-gray-900"
        >
          {{ l.code }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
