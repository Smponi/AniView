import { computed, ref } from 'vue';
import { fetchMediaCollection, fetchMediaStatsForUsers, fetchUserByName, fetchUserFollowing } from '../api/anilist';
import type { AnilistUser, MediaType } from '../types';

export function useSocialGraph(currentMediaType:  import('vue').Ref<MediaType>) {
  const followers = ref<AnilistUser[]>([]);
  // Speichert: Welcher User (Key) hat welche Media IDs (Value Set) gesehen?
  const followerMediaMaps = ref<Map<number, Set<number>>>(new Map()); 
  const followerScoresMap = ref<Map<number, Map<number, number>>>(new Map()); 
  const loadingSocial = ref(false);
  const userWeights = ref<Record<number, number>>({});

  // State für das Modal-Loading
  const loadingDetails = ref(false);

  const detailCache = ref<Map<number, any>>(new Map());

  // Temporärer Speicher für das aktuell geöffnete Media im Modal
  const currentMediaStats = ref<{
    ratings: { user: AnilistUser; score: number; status: string }[];
    average: number;
    median: number;
    count: number;
  } | null>(null);

  // 1. Follower laden
  const loadFollowers = async (userName: string) => {
    loadingSocial.value = true;
    followers.value = [];
    // NEU: Wenn wir einen neuen User laden, ist der alte Cache ungültig!
    detailCache.value.clear();

    try {
      console.log(`Lade ID für User: ${userName}...`);
      const userRes = await fetchUserByName(userName);
      const userId = userRes.data.User.id;

      console.log(`Lade Following für ID: ${userId}...`);
      const followRes = await fetchUserFollowing(userId);
      
      const rawList = followRes.data.Page.following;
      console.log(`${rawList.length} Follower gefunden.`);

      followers.value = rawList.map((u: any) => ({
        ...u,
        listLoaded: false // Initial wissen wir nicht, was sie gesehen haben
      }));

    } catch (e) {
      console.error("Fehler beim Laden des Social Graphs:", e);
    } finally {
      loadingSocial.value = false;
    }
  };

  // 2. Button "Compare" Logic
  const analyzeFollower = async (followerId: number) => {
    const follower = followers.value.find(u => u.id === followerId);
    if (!follower) {return;}
    
    // UI Feedback
    follower.listLoaded = 'LOADING'; // Wir könnten hier einen Status enum nutzen

    try {
      const res = await fetchMediaCollection(follower.name, currentMediaType.value, 1);
      const entries = res.data.MediaListCollection.lists.flatMap((l: any) => l.entries);
      
      const mediaScoreMap = new Map<number, number>();
      
      entries.forEach((e: any) => {
        // E.score ist hier im Format POINT_10 (0-10) oder POINT_100, wir nehmen roh
        // Und normalisieren ggf. später.
        mediaScoreMap.set(e.media.id, e.score || 0);
      });
      
      followerScoresMap.value.set(followerId, mediaScoreMap);
      follower.listLoaded = true;

    } catch (e) {
      console.error(e);
      follower.listLoaded = false;
    }
  };

  // Hilfsfunktion: Hole alle Bewertungen meiner Freunde für eine MediaID
  const getSocialDetails = (mediaId: number) => {
    const ratings: { user: AnilistUser; score: number }[] = [];

    followerScoresMap.value.forEach((mediaMap, userId) => {
      if (mediaMap.has(mediaId)) {
        const user = followers.value.find(u => u.id === userId);
        if (user) {
          ratings.push({
            score: mediaMap.get(mediaId) || 0,
            user
          });
        }
      }
    });

    // Stats berechnen
    const validScores = ratings.map(r => r.score).filter(s => s > 0);
    let average = 0;
    let median = 0;

    if (validScores.length > 0) {
      // Avg
      const sum = validScores.reduce((a, b) => a + b, 0);
      average = parseFloat((sum / validScores.length).toFixed(1));

      // Median
      validScores.sort((a, b) => a - b);
      const mid = Math.floor(validScores.length / 2);
      median = validScores.length % 2 !== 0 
        ? validScores[mid] 
        : (validScores[mid - 1] + validScores[mid]) / 2;
    }

    return {
      ratings, // Liste der Freunde + Score
      average,
      median,
      count: ratings.length
    };
  };
  // 3. Score Berechnung
  // Dies läuft jedes Mal neu, wenn followerMediaMaps oder userWeights sich ändern
  // Der Hype Score (vereinfacht)
  const socialScores = computed(() => {
    const scores = new Map<number, number>();
    followerScoresMap.value.forEach((mediaMap, userId) => {
      const weight = userWeights.value[userId] || 1;
      for (const mediaId of mediaMap.keys()) {
        const current = scores.get(mediaId) || 0;
        scores.set(mediaId, current + weight);
      }
    });
    return scores;
  });

  const toggleWeight = (userId: number) => {
    const current = userWeights.value[userId] || 1;
    userWeights.value[userId] = current === 1 ? 2 : 1;
  };

// NEU: Just-In-Time Fetching für das Modal
  const inspectMedia = async (mediaId: number) => {
    // 1. CACHE CHECK: Haben wir das schon berechnet?
    if (detailCache.value.has(mediaId)) {
      console.log(`Cache Hit für Media ${mediaId}`);
      currentMediaStats.value = detailCache.value.get(mediaId);
      return; // Sofort raus, kein Netzwerk-Request!
    }
    loadingDetails.value = true;
    currentMediaStats.value = null;

    try {
      const userIds = followers.value.map(u => u.id);
      if (userIds.length === 0) {
        // Leeres Resultat zurückgeben, damit Modal nicht ewig lädt
        currentMediaStats.value = { average: 0, count: 0, median: 0, ratings: [] };
        return;
      }

      const res = await fetchMediaStatsForUsers(mediaId, userIds);
      const data = res.data; 

      const ratings: { user: AnilistUser; score: number; status: string }[] = [];

      userIds.forEach(id => {
        const pageData = data[`u${id}`]; 
        
        // Check: Existiert die Page und hat sie Einträge?
        if (pageData && pageData.mediaList && pageData.mediaList.length > 0) {
          const entry = pageData.mediaList[0];
          const user = followers.value.find(u => u.id === id);
          
          if (user) {
            ratings.push({
              user,
              score: entry.score || 0, // 0 ist okay (z.B. bei PLANNING)
              status: entry.status
            });
          }
        }
      });

      // Statistik berechnen (Nur Scores > 0 zählen für Durchschnitt)
      const validScores = ratings.map(r => r.score).filter(s => s > 0);
      let average = 0;
      let median = 0;

      if (validScores.length > 0) {
        const sum = validScores.reduce((a, b) => a + b, 0);
        average = parseFloat((sum / validScores.length).toFixed(1));

        validScores.sort((a, b) => a - b);
        const mid = Math.floor(validScores.length / 2);
        median = validScores.length % 2 !== 0 
          ? validScores[mid] 
          : (validScores[mid - 1] + validScores[mid]) / 2;
      }

      // WICHTIG: Count ist ratings.length (Anzahl Freunde), nicht validScores (Anzahl Bewertungen)
      // So siehst du auch, wer es gerade schaut, aber noch nicht bewertet hat.
      const result = { 
        average, 
        count: ratings.length, 
        median, 
        ratings 
      };

      // 2. CACHE SAVE: Speichern für später
      detailCache.value.set(mediaId, result);
      
      // Anzeigen
      currentMediaStats.value = result;

    } catch (e) {
      console.error("Detail Fetch Error", e);
      // Fehlerzustand setzen, damit UI nicht hängt
      currentMediaStats.value = { average: 0, count: 0, median: 0, ratings: [] };
    } finally {
      loadingDetails.value = false;
    }
  };
  return {
    followers,
    loadFollowers,
    analyzeFollower, // Für die Listen-Sortierung
    inspectMedia,    // NEU: Für das Modal
    currentMediaStats, // NEU: Daten für das Modal
    loadingDetails,  // NEU
    socialScores,
    toggleWeight,
    userWeights,
    loadingSocial
  };
}
