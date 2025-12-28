import { useInfiniteQuery } from '@tanstack/vue-query';
import { type Ref, computed } from 'vue';
import { fetchMediaCollection } from '../api/anilist';
import type { MediaEntry, MediaType } from '../types';

export function useMediaList(userName: Ref<string>, mediaType: Ref<MediaType>) {
  
  // Die Query-Logik
  const query = useInfiniteQuery({
    // Query Key: Ändert sich einer dieser Werte, feuert die Query neu
    queryKey: ['mediaList', userName, mediaType],
    queryFn: ({ pageParam = 1 }) => fetchMediaCollection(userName.value, mediaType.value, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) => lastPage.data.MediaListCollection.hasNextChunk ? allPages.length + 1 : undefined,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
    refetchOnWindowFocus: false,
  });

  // Helper um die Daten flach zu klopfen (Flattening)
  const allEntries = computed(() => {
    if (!query.data.value) {return [];}
    
    const rawEntries = query.data.value.pages.flatMap((page: any) =>
      page.data.MediaListCollection.lists.flatMap((list: any) => list.entries)
    ) as MediaEntry[];

    // Duplikate entfernen (Sicherheitsmaßnahme)
    const uniqueMap = new Map();
    rawEntries.forEach((e) => uniqueMap.set(e.media.id, e));
    return Array.from(uniqueMap.values()) as MediaEntry[];
  });

  return {
    ...query,
    allEntries,
  };
}
