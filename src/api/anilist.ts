import type { MediaType } from '../types';

const ANILIST_API = 'https://graphql.anilist.co';

const QUERY = `
query ($userName: String, $type: MediaType, $chunk: Int) {
  MediaListCollection(userName: $userName, type: $type, chunk: $chunk, perChunk: 100) {
    lists {
      entries {
        score(format: POINT_10)
        status
        media {
          id
          title { english romaji }
          genres
          coverImage { extraLarge large }
          format
          episodes
          chapters
        }
      }
    }
    hasNextChunk
  }
}`;

export async function fetchMediaCollection(userName: string, type: MediaType, page: number) {
  const response = await fetch(ANILIST_API, {
    body: JSON.stringify({
      query: QUERY,
      variables: { chunk: page, type, userName },
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Anilist API Error');
  }

  return response.json();
}

// 1. User ID holen (Nötig für die Following Query)
const USER_ID_QUERY = `
query ($name: String) {
  User(name: $name) {
    id
    name
    avatar { large }
  }
}
`;

// 2. Wem folgt der Nutzer?
const FOLLOWING_QUERY = `
query ($userId: Int!, $page: Int) {
  Page(page: $page, perPage: 20) {
    pageInfo { hasNextPage }
    following(userId: $userId, sort: ID_DESC) {
      id
      name
      siteUrl
      avatar { medium }
    }
  }
}
`;

// Hilfsfunktion: ID fetchen
export async function fetchUserByName(name: string) {
  const res = await fetch(ANILIST_API, {
    body: JSON.stringify({ query: USER_ID_QUERY, variables: { name } }),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) {throw new Error('User not found');}
  return res.json();
}

// Hilfsfunktion: Follower fetchen
export async function fetchUserFollowing(userId: number, page = 1) {
  const res = await fetch(ANILIST_API, {
    body: JSON.stringify({ query: FOLLOWING_QUERY, variables: { page, userId } }),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return res.json();
}

// DYNAMISCHE QUERY GENERIERUNG
// Wir nutzen einen Alias "u<ID>", da Keys in GraphQL mit Buchstaben anfangen müssen.
export async function fetchMediaStatsForUsers(mediaId: number, userIds: number[]) {
  if (userIds.length === 0) {return {};}

  // Wir nutzen Page(perPage: 1), um 404 Fehler zu vermeiden, wenn ein Eintrag nicht existiert.
  // Statt "Error: Not Found" bekommen wir einfach ein leeres Array [].
  const queryParts = userIds.map(id => `
    u${id}: Page(perPage: 1) {
      mediaList(userId: ${id}, mediaId: ${mediaId}) {
        score(format: POINT_10)
        status
      }
    }
  `).join('\n');

  const query = `query { ${queryParts} }`;

  const res = await fetch(ANILIST_API, {
    body: JSON.stringify({ query }),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST'
  });

  // Jetzt sollten wir fast immer 200 OK bekommen, auch wenn User den Anime nicht gesehen haben
  if (!res.ok) {
    // Falls immer noch Fehler, loggen wir den Body für Debugging
    const err = await res.text();
    console.error("Anilist Batch Error:", err);
    throw new Error('Batch Fetch Failed');
  }
  
  return res.json();
}

