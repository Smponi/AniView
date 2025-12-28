<script setup lang="ts">
import type { MediaEntry, AnilistUser } from '../types';

// Props
const props = defineProps<{
  entry: MediaEntry;
  isOpen: boolean;
  loading: boolean;
  socialData: any;
  }>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Helper für Farben
const getScoreColor = (score: number) => {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#f59e0b';
  return '#ef4444'; 
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card">
          
          <!-- HEADER IMAGE -->
          <div class="header-img">
            <img :src="entry.media.coverImage.extraLarge || entry.media.coverImage.large" />
            <button class="close-btn" @click="emit('close')">×</button>
            <div class="header-overlay">
              <h2>{{ entry.media.title.english || entry.media.title.romaji }}</h2>
            </div>
          </div>

          <!-- CONTENT -->
          <div class="content">
            
            <!-- SECTION 1: MY RATING -->
            <div class="section">
              <h3>My Rating</h3>
              <div class="my-score">
                <span class="big-score" :style="{ color: getScoreColor(entry.score) }">
                  {{ entry.score }}
                </span>
                <span class="status">{{ entry.status }}</span>
              </div>
            </div>

            <!-- SECTION 2: SOCIAL STATS -->
            <div class="section social-section">
              <h3>Friend Consensus</h3>

            <!-- LOADER -->
            <div v-if="loading" class="loading-state">
              Fetching stats from {{ socialData?.ratings?.length || 'all' }} friends...
            </div>
            <div v-else-if="socialData">
              
              <div v-if="socialData.count === 0" class="empty">
                None of your analyzed friends have rated this yet.
              </div>

              <div v-else class="stats-grid">
                <!-- STAT BOXES -->
                <div class="stat-box">
                  <span class="label">Average</span>
                  <span class="value">{{ socialData.average }}</span>
                </div>
                <div class="stat-box">
                  <span class="label">Median</span>
                  <span class="value">{{ socialData.median }}</span>
                </div>
                <div class="stat-box">
                  <span class="label">Watched by</span>
                  <span class="value">{{ socialData.count }}</span>
                </div>
              </div>

              <!-- AVATAR LIST WITH SCORES -->
              <div v-if="socialData.count > 0" class="friend-ratings-list">
                <div 
                  v-for="item in socialData.ratings" 
                  :key="item.user.id" 
                  class="friend-row"
                >
                  <div class="friend-info">
                    <img :src="item.user.avatar.medium" class="avatar" />
                    <span class="name">{{ item.user.name }}</span>
                  </div>
                  
                  <div class="friend-score">
                    <div 
                      class="score-bubble"
                      :style="{ background: getScoreColor(item.score) }"
                    >
                      {{ item.score > 0 ? item.score : '-' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center; padding: 20px;
}

.modal-card {
  background: #0f172a; width: 100%; max-width: 500px;
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; flex-direction: column; max-height: 90vh;
}

.header-img {
  height: 200px; position: relative; flex-shrink: 0;
}
.header-img img { width: 100%; height: 100%; object-fit: cover; }
.header-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, #0f172a, transparent);
  padding: 20px; padding-top: 60px;
}
h2 { margin: 0; font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

.close-btn {
  position: absolute; top: 15px; right: 15px;
  background: rgba(0,0,0,0.5); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.close-btn:hover { background: white; color: black; }

.content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }

.section h3 {
  font-size: 0.8rem; text-transform: uppercase; color: #94a3b8;
  margin: 0 0 12px 0; letter-spacing: 1px;
}

.my-score { display: flex; align-items: baseline; gap: 10px; }
.big-score { font-size: 2.5rem; font-weight: 900; line-height: 1; }
.status { background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; }

.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;
}
.stat-box {
  background: rgba(255,255,255,0.05); padding: 10px; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center;
}
.stat-box .label { font-size: 0.7rem; color: #94a3b8; }
.stat-box .value { font-size: 1.2rem; font-weight: 700; color: white; }

.friend-ratings-list {
  display: flex; flex-direction: column; gap: 8px;
}
.friend-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 12px;
}
.friend-info { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.name { font-size: 0.9rem; font-weight: 500; }

.score-bubble {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.8rem; color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.empty { font-style: italic; color: #64748b; font-size: 0.9rem; }

/* Animation */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
