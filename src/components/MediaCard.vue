<script setup lang="ts">
import type { MediaEntry } from '../types';

// Wir definieren die Props, die von der MediaGrid/App.vue übergeben werden
defineProps<{
  entry: MediaEntry;
}>();

// Hilfsfunktion für Status-Farben
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CURRENT: '#3b82f6',
    COMPLETED: '#10b981',
    PLANNING: '#94a3b8',
    DROPPED: '#ef4444',
    PAUSED: '#f59e0b',
  };
  return colors[status] || '#64748b';
};

// Hilfsfunktion für Score-Farben (ästhetische Abstufung)
const getScoreColor = (score: number) => {
  if (score >= 8) return '#10b981'; // Grün
  if (score >= 6) return '#f59e0b'; // Orange
  if (score > 0) return '#ef4444';  // Rot
  return '#4b5563'; // Grau für 0
};
</script>

<template>
  <article class="card">
    <!-- Bildbereich -->
    <div class="image-wrapper">
      <img 
        :src="entry.media.coverImage.extraLarge || entry.media.coverImage.large" 
        loading="lazy" 
        alt="Cover"
      />
      <!-- Ein dunkler Verlauf von unten, damit der Text immer lesbar ist -->
      <div class="image-overlay"></div>
    </div>

    <!-- Hover-Details -->
    <div class="card-content">
      <div class="top-row">
        <span class="status-badge" :style="{ backgroundColor: getStatusColor(entry.status) }">
          {{ entry.status }}
        </span>
      </div>

      <div class="bottom-info">
        <h3 class="title">{{ entry.media.title.english || entry.media.title.romaji }}</h3>
        
        <div class="meta-data">
          <span class="format-tag">{{ entry.media.format }}</span>
          
          <!-- Ästhetischer Score-Ring/Badge -->
          <div 
            v-if="entry.score > 0" 
            class="score-circle"
            :style="{ borderColor: getScoreColor(entry.score), color: getScoreColor(entry.score) }"
          >
            {{ entry.score }}
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  aspect-ratio: 2/3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.card:hover {
  transform: scale(1.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.card:hover img {
  transform: scale(1.1);
  filter: brightness(0.3) blur(4px);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11, 37, 69, 0.8) 0%, transparent 100%);
}

/* Content Details */
.card-content {
  position: absolute;
  inset: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.card:hover .card-content {
  opacity: 1;
}

.status-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bottom-info {
  text-align: center;
}

.title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
}

.meta-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.format-tag {
  font-size: 0.7rem;
  background: white;
  color: black;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 800;
}

/* Aesthetic Score Ring */
.score-circle {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 900;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
</style>
