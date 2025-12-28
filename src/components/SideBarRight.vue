<script setup lang="ts">
import { ref } from 'vue';
import type { AnilistUser } from '../types';

const props = defineProps<{
  counts: [string, number][]; // Genre Counts
  selectedGenres: Set<string>;
  followers: AnilistUser[];
  userWeights: Record<number, number>;
  loadingSocial: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleGenre', genre: string): void;
  (e: 'analyzeUser', userId: number): void;
  (e: 'toggleWeight', userId: number): void;
}>();

const activeTab = ref<'GENRES' | 'SOCIAL'>('GENRES');
</script>

<template>
  <aside class="sidebar">
    <!-- TABS -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'GENRES' }" @click="activeTab = 'GENRES'">Genres</button>
      <button :class="{ active: activeTab === 'SOCIAL' }" @click="activeTab = 'SOCIAL'">Community</button>
    </div>

    <!-- TAB 1: GENRES -->
    <div v-if="activeTab === 'GENRES'" class="content-scroll">
      <div class="header">Filter Genres</div>
      <div class="genre-cloud">
        <button 
          v-for="[genre, count] in counts" :key="genre"
          class="chip" :class="{ active: selectedGenres.has(genre) }"
          @click="emit('toggleGenre', genre)"
        >
          {{ genre }} <span class="count">{{ count }}</span>
        </button>
      </div>
    </div>

    <!-- TAB 2: SOCIAL -->
    <div v-else class="content-scroll">
      <div class="header">Following ({{ followers.length }})</div>
      
      <div v-if="loadingSocial" class="loading-text">Loading network...</div>
      
      <div v-else class="follower-list">
        <div v-for="user in followers" :key="user.id" class="user-row">
          <a :href="user.siteUrl" target="_blank" class="avatar-link">
            <img :src="user.avatar.medium" class="avatar" />
          </a>
          
          <div class="user-info">
            <div class="name">{{ user.name }}</div>
            <div class="actions">
              <!-- Load Button -->
              <button 
                class="action-btn load" 
                :class="{ loaded: user.listLoaded }"
                @click="emit('analyzeUser', user.id)"
                :disabled="user.listLoaded"
              >
                {{ user.listLoaded ? 'Analyzed' : 'Compare' }}
              </button>

              <!-- Star Button (Weight) -->
              <button 
                class="action-btn star"
                :class="{ active: (userWeights[user.id] || 1) > 1 }"
                @click="emit('toggleWeight', user.id)"
                title="Mark as Tastemaker"
              >
                ★
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: rgba(19, 49, 92, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
  overflow: hidden; /* Scroll passiert im content-scroll */
}

.tabs {
  display: flex; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 4px;
}
.tabs button {
  flex: 1; background: none; border: none; color: var(--text-mute);
  padding: 8px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem;
}
.tabs button.active { background: var(--bg-card); color: white; }

.content-scroll { overflow-y: auto; flex: 1; padding-right: 4px; display: flex; flex-direction: column; gap: 12px; }

/* Existing Genre Styles... (reuse from previous) */
.genre-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { /* ... */ }
.header { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-mute); }

/* NEW: Social Styles */
.follower-list { display: flex; flex-direction: column; gap: 12px; }
.user-row {
  display: flex; gap: 10px; align-items: center;
  background: rgba(255,255,255,0.03); padding: 8px; border-radius: 12px;
}
.avatar { width: 40px; height: 40px; border-radius: 12px; object-fit: cover; } /* Rounded Box Avatar */
.user-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.name { font-size: 0.85rem; font-weight: 600; }

.actions { display: flex; gap: 6px; }
.action-btn {
  border: 1px solid var(--border); background: transparent; color: var(--text-mute);
  border-radius: 6px; font-size: 0.65rem; padding: 2px 6px; cursor: pointer;
}
.action-btn.load:hover { background: rgba(255,255,255,0.1); }
.action-btn.loaded { background: var(--accent); color: white; border-color: var(--accent); opacity: 0.5; }

.action-btn.star { font-size: 0.9rem; line-height: 1; padding: 0 4px; }
.action-btn.star.active { color: #fbbf24; border-color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
</style>
