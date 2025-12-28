import { computed, ref } from 'vue';
import { fetchMediaCollection, fetchMediaStatsForUsers, fetchUserByName, fetchUserFollowing } from '../api/anilist';
import type { AnilistUser, MediaType } from '../types';

export function useSocialGraph(currentMediaType: import('vue').Ref<MediaType>) {
  const followers = ref<AnilistUser[]>([]);
  const loadingSocial = ref(false);
  const loadingDetails = ref(false);
  
  // Zentraler Store für Social Data: Map<UserId, Map<MediaId, Score>>
  const followerScoresMap = ref<Map<number, Map<number, number>>>(new Map()); 
  const userWeights = ref<Record<number, number>>({});
  const detailCache = ref<Map<number, any>>(new Map());
  const currentMediaStats = ref<any>(null);

  const loadFollowers = async (userName: string) => {
    loadingSocial.value = true;
    followers.value = [];
    detailCache.value.clear();
    try {
      const userRes = await fetchUserByName(userName);
      const userId = userRes.data.User.id;
      const followRes = await fetchUserFollowing(userId);
      followers.value = followRes.data.Page.following.map((u: any) => ({
        ...u,
        listLoaded: false
      }));
    } catch (e) {
      console.error("Social Graph Error", e);
    } finally {
      loadingSocial.value = false;
    }
  };

  const analyzeFollower = async (followerId: number) => {
    const follower = followers.value.find(u => u.id === followerId);
    if (!follower || follower.listLoaded) {return;}

    try {
      const res = await fetchMediaCollection(follower.name, currentMediaType.value, 1);
      const entries = res.data.MediaListCollection.lists.flatMap((l: any) => l.entries);
      const mediaScoreMap = new Map<number, number>();
      
      entries.forEach((e: any) => mediaScoreMap.set(e.media.id, e.score || 0));
      
      followerScoresMap.value.set(followerId, mediaScoreMap);
      follower.listLoaded = true;
    } catch (e) {
      console.error(e);
    }
  };

  // JIT Fetching für Modal
  const inspectMedia = async (mediaId: number) => {
    if (detailCache.value.has(mediaId)) {
      currentMediaStats.value = detailCache.value.get(mediaId);
      return;
    }

    loadingDetails.value = true;
    try {
      const userIds = followers.value.map(u => u.id);
      if (userIds.length === 0) {
        currentMediaStats.value = { average: 0, count: 0, median: 0, ratings: [] };
        return;
      }

      const res = await fetchMediaStatsForUsers(mediaId, userIds);
      const data = res.data;
      const ratings: any[] = [];

      userIds.forEach(id => {
        const pageData = data[`u${id}`];
        if (pageData?.mediaList?.length > 0) {
          const entry = pageData.mediaList[0];
          const user = followers.value.find(u => u.id === id);
          if (user) {ratings.push({ score: entry.score || 0, status: entry.status, user });}
        }
      });

      const validScores = ratings.map(r => r.score).filter(s => s > 0);
      let average = 0, median = 0;

      if (validScores.length > 0) {
        average = parseFloat((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1));
        validScores.sort((a, b) => a - b);
        const mid = Math.floor(validScores.length / 2);
        median = validScores.length % 2 !== 0 ? validScores[mid] : (validScores[mid - 1] + validScores[mid]) / 2;
      }

      const result = { average, count: ratings.length, median, ratings };
      detailCache.value.set(mediaId, result);
      currentMediaStats.value = result;
    } finally {
      loadingDetails.value = false;
    }
  };

  // Korrigierter Social Score (Hype) nutzt nun followerScoresMap
  const socialScores = computed(() => {
    const scores = new Map<number, number>();
    followerScoresMap.value.forEach((mediaMap, userId) => {
      const weight = userWeights.value[userId] || 1;
      mediaMap.forEach((_, mediaId) => {
        const current = scores.get(mediaId) || 0;
        scores.set(mediaId, current + weight);
      });
    });
    return scores;
  });

  const toggleWeight = (userId: number) => {
    userWeights.value[userId] = (userWeights.value[userId] || 1) === 1 ? 2 : 1;
  };

  return {
    analyzeFollower,
    currentMediaStats,
    followers,
    inspectMedia,
    loadFollowers,
    loadingDetails,
    loadingSocial,
    socialScores,
    toggleWeight,
    userWeights
  };
}