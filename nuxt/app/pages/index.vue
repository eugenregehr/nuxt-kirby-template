<script setup lang="ts">
const page = await useKirbyPage('home')
</script>

<template>
  <NuxtLayout>
    <KirbyPageBody :page="page" />
  </NuxtLayout>
</template>
