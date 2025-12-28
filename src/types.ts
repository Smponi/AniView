export interface MediaEntry {
  score: number;
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
  notes: string | null;
  media: {
    title: {
      english: string;
      romaji?: string; // Fallback, falls english null ist
    };
    genres: string[];
    coverImage: {
      medium: string;
      large?: string;
    };
  };
}

export interface MediaList {
  name: string;
  entries: MediaEntry[];
}

export interface AnilistResponse {
  data: {
    MediaListCollection: {
      lists: MediaList[];
      hasNextChunk: boolean;
    };
  };
}
