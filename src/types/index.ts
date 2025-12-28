export interface MediaTitle {
  english?: string;
  romaji: string;
}

export interface MediaCover {
  extraLarge: string;
  large: string;
}

export interface Media {
  id: number;
  title: MediaTitle;
  genres: string[];
  coverImage: MediaCover;
  format: string;
  episodes?: number;
  chapters?: number;
}

export interface MediaEntry {
  score: number; // 0-10 or 0-100 depending on request, we use POINT_10
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
  media: Media;
}

// Für die Filter
export type MediaType = 'ANIME' | 'MANGA';

export interface UserAvatar {
  medium: string;
  large?: string;
}

export interface AnilistUser {
  id: number;
  name: string;
  siteUrl: string;
  avatar: UserAvatar;
  // Local State für uns:
  weight?: number; // 1 = Normal, 2 = Wichtig (Stern vergeben)
  listLoaded?: boolean; // Haben wir dessen Liste schon gefetcht?
}

export type SortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'SOCIAL_HYPE' | 'DATE_DESC';
