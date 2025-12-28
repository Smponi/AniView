<script setup lang="ts">
import { ref, computed, watch, onMounted, ref as vueRef } from 'vue';
import { useMediaList } from './composables/useMediaList';
import { useSocialGraph } from './composables/useSocialGraph';

// COMPONENTS
import SidebarLeft from './components/SidebarLeft.vue';
import SidebarRight from './components/SidebarRight.vue';
import MediaCard from './components/MediaCard.vue';
import SkeletonCard from './components/ui/SkeletonCard.vue';
import MediaDetailModal from './components/MediaDetailModal.vue';
import BaseIcon from './components/ui/BaseIcon.vue'; // <--- FIX FÜR "Failed to resolve component"
import type { MediaType, MediaEntry, SortOption } from './types';

// --- STATE ---
const userName = ref('Ryo5678');
const debouncedName = ref(userName.value);
const mediaType = ref<MediaType>('ANIME');
const selectedStatus = ref('ALL');
const selectedGenres = ref<Set<string>>(new Set());
const sortOption = ref<SortOption>('DATE_DESC');

// Modal State
const selectedEntry = ref<MediaEntry | null>(null);
const isModalOpen = ref(false);

// Debounce Timer
let timer: number;
watch(userName, (val) => {
  clearTimeout(timer);
  timer = setTimeout(() => debouncedName.value = val, 600);
});

// --- COMPOSABLES ---
const { 
  allEntries, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage, 
  isLoading, 
  isError 
} = useMediaList(debouncedName, mediaType);

const { 
  loadFollowers, 
  analyzeFollower, 
  inspectMedia,      // <--- NEUE FUNKTION (JIT FETCH)
  currentMediaStats, // <--- HIER SIND DIE DATEN FÜR DAS MODAL
  loadingDetails,    // <--- LOADING STATE FÜRS MODAL
  followers, 
  userWeights, 
  loadingSocial, 
  socialScores,
  toggleWeight
} = useSocialGraph(mediaType);

// Load followers when user changes
watch(debouncedName, (val) => {
  if (val) loadFollowers(val);
}, { immediate: true });

// --- MODAL ACTION ---
const openModal = (entry: MediaEntry) => {
  selectedEntry.value = entry;
  isModalOpen.value = true;
  // Wir rufen KEIN computed property mehr auf, sondern starten den Fetch:
  inspectMedia(entry.media.id);
};

// --- FILTER & SORT ---
const processedEntries = computed(() => {
  // 1. Filter
  let res = allEntries.value.filter(entry => {
    const statusMatch = selectedStatus.value === 'ALL' || entry.status === selectedStatus.value;
    const genreMatch = selectedGenres.value.size === 0 || 
      [...selectedGenres.value].every(g => entry.media.genres.includes(g));
    return statusMatch && genreMatch;
  });

  // 2. Sort
  return res.sort((a, b) => {
    switch (sortOption.value) {
      case 'SCORE_ASC': 
        return (a.score || 0) - (b.score || 0);
      case 'SCORE_DESC': 
        return (b.score || 0) - (a.score || 0);
      case 'SOCIAL_HYPE': 
        const scoreA = socialScores.value.get(a.media.id) || 0;
        const scoreB = socialScores.value.get(b.media.id) || 0;
        return (scoreB - scoreA) || ((b.score || 0) - (a.score || 0));
      default: 
        return 0;
    }
  });
});

// --- COUNTS ---
const statusCounts = computed(() => {
  const counts: Record<string, number> = { ALL: allEntries.value.length };
  allEntries.value.forEach(e => counts[e.status] = (counts[e.status] || 0) + 1);
  return counts;
});

const genreCounts = computed(() => {
  const counts: Record<string, number> = {};
  const context = selectedStatus.value === 'ALL' 
    ? allEntries.value 
    : allEntries.value.filter(e => e.status === selectedStatus.value); 
  context.forEach(e => e.media.genres.forEach(g => counts[g] = (counts[g] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
});

// --- SCROLL OBSERVER ---
const triggerEl = vueRef<HTMLElement | null>(null);
onMounted(() => {
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNextPage.value && !isFetchingNextPage.value) {
      fetchNextPage();
    }
  }, { rootMargin: '400px' });
  if (triggerEl.value) obs.observe(triggerEl.value);
});
</script>

<template>
  <div class="layout">
    
    <!-- LEFT: Profile & Navigation -->
    <SidebarLeft 
      v-model:userName="userName"
      v-model:mediaType="mediaType"
      v-model:selectedStatus="selectedStatus"
      :counts="statusCounts"
    />

    <!-- CENTER: Main Content -->
    <main class="main-area">
      <!-- NEU: Toolbar für Sortierung und Infos -->
      <header class="toolbar">
        <div class="stats">
          <span class="count">{{ processedEntries.length }} Einträge</span>
          <span v-if="selectedGenres.size > 0" class="filter-tag">
            + {{ selectedGenres.size }} Filter
          </span>
        </div>

        <div class="sort-actions">
          <BaseIcon name="filter" />
          <select v-model="sortOption" class="sort-select">
            <option value="DATE_DESC">Zuletzt aktualisiert</option>
            <option value="SCORE_DESC">Beste Bewertung</option>
            <option value="SCORE_ASC">Schlechteste Bewertung</option>
            <option value="SOCIAL_HYPE">Social Hype (Follower)</option>
          </select>
        </div>
      </header>

      <!-- SKELETON LOADING -->
      <div v-if="isLoading && !allEntries.length" class="grid">
        <SkeletonCard v-for="n in 12" :key="n" />
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="isError" class="error-msg">
        User nicht gefunden oder Liste ist privat.
      </div>

      <!-- GRID -->
      <div v-else class="grid">
        <TransitionGroup name="list">
          <MediaCard 
            v-for="entry in processedEntries" 
            :key="entry.media.id" 
            :entry="entry" 
            @click="openModal(entry)"
          />
        </TransitionGroup>
      </div>

 <!-- MODAL -->
  <MediaDetailModal 
    v-if="selectedEntry"
    :isOpen="isModalOpen"
    :entry="selectedEntry"
    :loading="loadingDetails"
    :socialData="currentMediaStats" 
    @close="isModalOpen = false"
  />
      
      <!-- INFINITE SCROLL TRIGGER -->
      <div ref="triggerEl" class="trigger">
        <span v-if="isFetchingNextPage" class="loader"></span>
      </div>
    </main>

    <!-- RIGHT: Genres & Social Discovery -->
    <SidebarRight 
      :counts="genreCounts"
      :selectedGenres="selectedGenres"
      :followers="followers"
      :userWeights="userWeights"
      :loadingSocial="loadingSocial"
      @toggleGenre="g => selectedGenres.has(g) ? selectedGenres.delete(g) : selectedGenres.add(g)"
      @analyzeUser="analyzeFollower"
      @toggleWeight="toggleWeight"
    />
  </div>
</template>

<style>
/* Globale CSS Variablen & Reset */
:root {
  --bg-dark: #0b2545;
  --bg-card: #134074;
  --text-main: #eef4ed;
  --text-mute: #8da9c4;
  --accent: #3b82f6;
  --border: rgba(255,255,255,0.08);
}
body {
  margin: 0;
  background: radial-gradient(circle at 50% 0, #1b3a6b, #0b2545);
  background-attachment: fixed;
  color: var(--text-main);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}
/* Hide Scrollbars */
*::-webkit-scrollbar { display: none; }
* { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<style scoped>
.layout {
  display: flex; height: 100vh; padding: 20px; gap: 20px; box-sizing: border-box;
}
.main-area {
  flex: 1; overflow-y: auto; padding-bottom: 50px;
  /* Soft mask top/bottom */
  mask-image: linear-gradient(to bottom, transparent, black 20px, black 95%, transparent);
}
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 24px; padding-top: 20px;
}
.error-msg { text-align: center; margin-top: 100px; color: var(--text-mute); }
.trigger { height: 60px; display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 20px; }
.loader { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Vue Transition */
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid var(--border);
}

.stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.count {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-mute);
}

.filter-tag {
  font-size: 0.7rem;
  background: var(--accent);
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
}

.sort-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-select {
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.sort-select option {
  background: var(--bg-dark);
  color: white;
}
</style>
