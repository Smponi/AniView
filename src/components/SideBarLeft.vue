<script setup lang="ts">
import BaseIcon from './ui/BaseIcon.vue';
import type { MediaType } from '../types';

// Definition, was diese Component als v-model akzeptiert
const props = defineProps<{
  userName: string;
  mediaType: MediaType;
  selectedStatus: string;
  counts: Record<string, number>;
}>();

// Events um Änderungen an Parent zu melden
const emit = defineEmits<{
  (e: 'update:userName', val: string): void;
  (e: 'update:mediaType', val: MediaType): void;
  (e: 'update:selectedStatus', val: string): void;
}>();

const statuses = ['ALL', 'CURRENT', 'COMPLETED', 'PLANNING', 'PAUSED', 'DROPPED'];

// Helper for local event handling
const updateName = (e: Event) => emit('update:userName', (e.target as HTMLInputElement).value);
</script>

<template>
  <aside class="sidebar">
    <div class="brand">Ani<span class="highlight">View</span></div>
    
    <!-- User Input -->
    <div class="input-group">
      <BaseIcon name="search" class="icon" />
      <input 
        :value="userName" 
        @input="updateName" 
        placeholder="Username..." 
      />
    </div>

    <!-- Type Toggles -->
    <div class="toggles">
      <button 
        :class="{ active: mediaType === 'ANIME' }" 
        @click="emit('update:mediaType', 'ANIME')"
      >Anime</button>
      <button 
        :class="{ active: mediaType === 'MANGA' }" 
        @click="emit('update:mediaType', 'MANGA')"
      >Manga</button>
    </div>

    <!-- Navigation -->
    <nav>
      <button 
        v-for="status in statuses" :key="status"
        class="nav-item"
        :class="{ active: selectedStatus === status }"
        @click="emit('update:selectedStatus', status)"
      >
        <span>{{ status }}</span>
        <span class="badge">{{ counts[status] || 0 }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: rgba(19, 49, 92, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 20px;
}
.brand { font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; }
.highlight { color: var(--accent); }

.input-group { position: relative; }
.input-group .icon { position: absolute; left: 12px; top: 12px; color: var(--text-mute); }
.input-group input {
  width: 100%; padding: 12px 12px 12px 40px;
  background: rgba(0,0,0,0.2); border: 1px solid var(--border);
  border-radius: 12px; color: white; outline: none; box-sizing: border-box;
}
.input-group input:focus { border-color: var(--accent); }

.toggles { display: flex; gap: 5px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px; }
.toggles button {
  flex: 1; background: none; border: none; color: var(--text-mute);
  padding: 8px; border-radius: 8px; cursor: pointer; font-weight: 600;
}
.toggles button.active { background: var(--bg-card); color: white; }

.nav-item {
  width: 100%; display: flex; justify-content: space-between;
  padding: 12px; background: none; border: none; color: var(--text-mute);
  cursor: pointer; border-radius: 12px; transition: 0.2s;
}
.nav-item:hover { background: rgba(255,255,255,0.05); }
.nav-item.active { background: rgba(255,255,255,0.1); color: white; }
.badge { font-size: 0.8rem; opacity: 0.7; }
</style>
