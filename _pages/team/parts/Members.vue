<script setup lang="ts">
import type { KirbyTeamMember } from '../query'

/**
 * A section of the `team` page type. Sections live in `parts/` and are
 * imported relatively — they belong to this page type alone, so they need
 * no registry and no global component name.
 */
defineProps<{
  members: KirbyTeamMember[]
}>()
</script>

<template>
  <ul class="mt-12 grid gap-6 sm:grid-cols-3">
    <li
      v-for="member in members"
      :key="member.name"
      class="rounded-2xl bg-gray-100 p-6 text-center"
    >
      <p class="font-semibold">
        {{ member.name }}
      </p>
      <p v-if="member.role" class="mt-1 text-sm text-gray-500">
        {{ member.role }}
      </p>
    </li>
  </ul>
</template>
