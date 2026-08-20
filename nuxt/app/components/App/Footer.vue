<script setup lang="ts">
const site = useSite()
const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-gray-200">
    <div class="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">
      © {{ year }} {{ site.title }} — {{ t('footer.tagline') }}
    </div>
  </footer>
</template>
