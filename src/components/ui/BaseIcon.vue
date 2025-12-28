<script setup lang="ts">
// Props definieren, was von außen reinkommt
defineProps<{
  name: 'search' | 'star' | 'filter'; // Restrictive Types für Sicherheit
}>();
</script>

<template>
  <svg 
    v-if="name === 'search'" 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  >
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>

  <svg 
    v-else-if="name === 'filter'" 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
</template>

<style scoped>
svg { width: 18px; height: 18px; }
</style>
